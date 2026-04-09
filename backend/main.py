# NexusEdu Backend — canonical file. Root main.py is deleted.
import asyncio
import math
import time
import os
from contextlib import asynccontextmanager
from typing import Optional, Tuple

class LRUDict:
    def __init__(self, max_size=300, ttl_seconds=3600):  # 1 hour TTL
        self.max_size = max_size
        self.ttl = ttl_seconds
        self._store: dict = {}  # key → (value, timestamp)
        self._access_order: list = []
    
    def __setitem__(self, key, value):
        if key in self._store:
            self._access_order.remove(key)
        elif len(self._store) >= self.max_size:
            oldest = self._access_order.pop(0)
            del self._store[oldest]
        self._store[key] = (value, time.time())
        self._access_order.append(key)
    
    def __getitem__(self, key):
        if key not in self._store:
            raise KeyError(key)
        value, ts = self._store[key]
        if time.time() - ts > self.ttl:
            del self._store[key]
            self._access_order.remove(key)
            raise KeyError(key)
        self._access_order.remove(key)
        self._access_order.append(key)
        return value
    
    def get(self, key, default=None):
        try:
            return self[key]
        except KeyError:
            return default

    def __contains__(self, key):
        try:
            self[key]
            return True
        except KeyError:
            return False
            
    def __len__(self):
        return len(self._store)

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, Response
from pyrogram import Client

# ─── CONFIG ───────────────────────────────────────────────────
_api_id_raw = os.environ.get("TELEGRAM_API_ID")
_api_hash_raw = os.environ.get("TELEGRAM_API_HASH")

if _api_id_raw and _api_hash_raw:
    API_ID = int(_api_id_raw)
    API_HASH = _api_hash_raw
else:
    print("WARNING: Telegram credentials not in environment.")
    print("Set TELEGRAM_API_ID and TELEGRAM_API_HASH env vars.")
    API_ID = 0
    API_HASH = ""

SESSION_STRING  = os.environ.get("PYROGRAM_SESSION_STRING", "")
SUPABASE_URL    = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY    = os.environ.get("SUPABASE_SERVICE_KEY", "")

TEST_CHANNEL_ID = -1003569793885
TEST_MESSAGE_ID = 3
CHUNK_SIZE      = 1024 * 1024        # 1 MB per chunk from Telegram
CATALOG_TTL     = 300                # 5 min cache
INITIAL_BUFFER  = 512 * 1024         # 512 KB first response — starts playing fast

# ─── STATE ────────────────────────────────────────────────────
tg: Optional[Client] = None
catalog_cache   = {"data": None, "timestamp": 0}
video_map       = {}          # uuid → {channel_id, message_id}
message_cache: LRUDict = LRUDict(max_size=300, ttl_seconds=3600)
resolved_channels = set()

# ─── CORS (explicitly added to every StreamingResponse) ───────
CORS_HEADERS = {
    "Access-Control-Allow-Origin":   "*",
    "Access-Control-Allow-Headers":  "*",
    "Access-Control-Allow-Methods":  "GET, HEAD, OPTIONS",
    "Access-Control-Expose-Headers": (
        "Content-Range, Accept-Ranges, Content-Length, Content-Type"
    ),
}

# ─── TELEGRAM HELPERS ─────────────────────────────────────────
async def resolve_channel(channel_id: int | str) -> bool:
    cid = int(str(channel_id))
    if cid in resolved_channels:
        return True
    try:
        await tg.get_chat(cid)
        resolved_channels.add(cid)
        print(f"[NexusEdu] Resolved channel {cid}")
        return True
    except Exception as e:
        print(f"[NexusEdu] Could not resolve {cid}: {e}")
        return False


async def preload_channels():
    try:
        async for dialog in tg.get_dialogs():
            try:
                resolved_channels.add(dialog.chat.id)
            except Exception:
                pass
        print(f"[NexusEdu] {len(resolved_channels)} channels loaded from dialogs.")
    except Exception as e:
        print(f"[NexusEdu] Dialog preload error: {e}")


async def get_message(channel_id: int, message_id: int):
    """Fetch and cache a Telegram message object."""
    key = f"{channel_id}_{message_id}"
    if key not in message_cache:
        msg = await tg.get_messages(channel_id, message_id)
        message_cache[key] = msg
    return message_cache.get(key)


async def get_file_info(channel_id: int, message_id: int) -> Tuple[int, str]:
    """
    Returns (file_size_bytes, mime_type).
    Videos uploaded as FILES in Telegram appear as 'document' —
    we detect this and force video/mp4 for browser playback.
    """
    msg = await get_message(channel_id, message_id)
    if msg.video:
        return msg.video.file_size, "video/mp4"
    if msg.document:
        mime = msg.document.mime_type or "video/mp4"
        if "video" not in mime.lower():
            mime = "video/mp4"
        return msg.document.file_size, mime
    return 0, "video/mp4"


# ─── PRE-WARM (eliminates cold-start delay on first play) ─────
async def _prewarm_all(video_items: list):
    total = len(video_items)
    if total == 0: return
    print(f"[NexusEdu] Pre-warming {total} videos in parallel batches...")
    BATCH_SIZE = 10
    fetched = 0
    for i in range(0, total, BATCH_SIZE):
        batch = video_items[i:i+BATCH_SIZE]
        tasks = []
        for video_id, info in batch:
            cid_str = info.get("channel_id", "")
            message_id = info.get("message_id", 0)
            if not cid_str or not message_id:
                continue
            key = f"{cid_str}_{message_id}"
            if key not in message_cache:
                tasks.append(_prewarm_single(cid_str, message_id, key))
        results = await asyncio.gather(*tasks, return_exceptions=True)
        fetched += sum(1 for r in results if r is True)
        await asyncio.sleep(0.5)  # 0.5s between batches of 10
    print(f"[NexusEdu] Pre-warm done: {fetched}/{total} cached.")

async def _prewarm_single(cid_str: str, message_id: int, cache_key: str) -> bool:
    try:
        cid = int(cid_str)
        await resolve_channel(cid)
        msg = await tg.get_messages(cid, message_id)
        if msg and not msg.empty:
            message_cache[cache_key] = msg
            return True
    except Exception:
        pass
    return False


# ─── SUPABASE FETCH ───────────────────────────────────────────
async def fetch_supabase(path: str, client: httpx.AsyncClient) -> list:
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    r = await client.get(
        f"{SUPABASE_URL}/rest/v1/{path}", headers=headers, timeout=30
    )
    r.raise_for_status()
    return r.json()


async def fetch_all_videos(client: httpx.AsyncClient) -> list:
    """Paginated — handles 1,458+ videos reliably."""
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    all_videos, offset = [], 0
    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/videos"
            f"?is_active=eq.true&order=display_order"
            f"&offset={offset}&limit=1000"
        )
        r = await client.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        all_videos.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    return all_videos


# ─── CATALOG BUILD ────────────────────────────────────────────
async def refresh_catalog():
    global catalog_cache, video_map

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[NexusEdu] Supabase not configured — skipping catalog.")
        return

    try:
        async with httpx.AsyncClient() as client:
            subjects = await fetch_supabase(
                "subjects?is_active=eq.true&order=display_order", client)
            cycles   = await fetch_supabase(
                "cycles?is_active=eq.true&order=display_order", client)
            chapters = await fetch_supabase(
                "chapters?is_active=eq.true&order=display_order", client)
            videos   = await fetch_all_videos(client)

        # Build video_map for O(1) stream lookups
        new_map = {}
        for v in videos:
            new_map[v["id"]] = {
                "channel_id": v.get("telegram_channel_id", ""),
                "message_id": v.get("telegram_message_id", 0),
            }
        video_map = new_map

        # Resolve all Telegram channels found in cycles
        for cid in {c.get("telegram_channel_id") for c in cycles
                    if c.get("telegram_channel_id")}:
            await resolve_channel(cid)

        # Assemble nested hierarchy
        result = []
        for subj in subjects:
            s_cycles = sorted(
                [c for c in cycles if c["subject_id"] == subj["id"]],
                key=lambda x: x.get("display_order", 0),
            )
            subj_data = {**subj, "cycles": []}
            for cyc in s_cycles:
                c_chapters = sorted(
                    [ch for ch in chapters if ch["cycle_id"] == cyc["id"]],
                    key=lambda x: x.get("display_order", 0),
                )
                cyc_data = {**cyc, "chapters": []}
                for chap in c_chapters:
                    c_videos = sorted(
                        [v for v in videos if v["chapter_id"] == chap["id"]],
                        key=lambda x: x.get("display_order", 0),
                    )
                    cyc_data["chapters"].append({
                        **chap,
                        "videos": [
                            {
                                "id":       v["id"],
                                "title":    v["title"],
                                "duration": v.get("duration", "00:00:00"),
                                "size_mb":  v.get("size_mb", 0),
                            }
                            for v in c_videos
                        ],
                    })
                subj_data["cycles"].append(cyc_data)
            result.append(subj_data)

        catalog_cache = {
            "data":      {"subjects": result, "total_videos": len(videos)},
            "timestamp": time.time(),
        }
        print(f"[NexusEdu] Catalog loaded: {len(videos)} video(s).")

        # Pre-warm all messages in background — eliminates first-play delay
        asyncio.create_task(_prewarm_all(list(video_map.items())))

    except Exception as e:
        print(f"[NexusEdu] Catalog load error: {e}")


# ─── LIFESPAN ─────────────────────────────────────────────────
async def ensure_telegram_connected():
    """
    Checks if the Telegram client is connected.
    If not, attempts to reconnect automatically.
    Called before every stream request and by the watchdog.
    """
    global tg
    try:
        if tg is None or not tg.is_connected:
            print("[NexusEdu] Telegram disconnected, reconnecting...")
            if tg is not None:
                try:
                    await tg.stop()
                except Exception:
                    pass
            tg = Client(
                "nexusedu_session",
                api_id=API_ID,
                api_hash=API_HASH,
                session_string=SESSION_STRING,
                in_memory=True,
            )
            await tg.start()
            await preload_channels()
            print("[NexusEdu] Telegram reconnected successfully.")
            return True
        return True
    except Exception as e:
        print(f"[NexusEdu] Reconnect failed: {e}")
        return False

async def telegram_watchdog():
    """Monitor Telegram connection with exponential backoff."""
    fail_count = 0
    while True:
        try:
            await ensure_telegram_connected()
            fail_count = 0
            await asyncio.sleep(60)
        except Exception as e:
            fail_count += 1
            wait = min(60 * (2 ** (fail_count - 1)), 900)
            print(f"[watchdog] fail #{fail_count}, retry in {wait}s: {e}")
            await asyncio.sleep(wait)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global tg
    print("[NexusEdu] Starting Telegram client...")
    tg = Client(
        "nexusedu_session",
        api_id=API_ID,
        api_hash=API_HASH,
        session_string=SESSION_STRING,
        in_memory=True,
    )
    await tg.start()
    print("[NexusEdu] Telegram client started.")
    await preload_channels()
    await resolve_channel(TEST_CHANNEL_ID)
    await refresh_catalog()
    asyncio.create_task(telegram_watchdog())
    yield
    print("[NexusEdu] Stopping Telegram client...")
    await tg.stop()


# ─── APP ──────────────────────────────────────────────────────
app = FastAPI(title="NexusEdu Backend", lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=500)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "HEAD", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=[
        "Content-Range", "Accept-Ranges", "Content-Length", "Content-Type"
    ],
)


# ─── STREAMING CORE ───────────────────────────────────────────
async def _stream_telegram(
    channel_id: int, message_id: int,
    start: int, end: int, total: int
):
    """
    Async generator — pulls 1MB chunks from Telegram and yields bytes.
    Byte-accurate: handles non-aligned range starts via skip_bytes.
    """
    chunk_offset = start // CHUNK_SIZE
    skip_bytes   = start % CHUNK_SIZE
    needed       = math.ceil((end - start + 1 + skip_bytes) / CHUNK_SIZE)

    msg = await get_message(channel_id, message_id)

    bytes_sent  = 0
    target      = end - start + 1
    first_chunk = True

    async for chunk in tg.stream_media(msg, offset=chunk_offset, limit=needed):
        data = bytes(chunk)
        if first_chunk and skip_bytes:
            data        = data[skip_bytes:]
            first_chunk = False
        remaining = target - bytes_sent
        if len(data) > remaining:
            data = data[:remaining]
        if not data:
            break
        bytes_sent += len(data)
        yield data
        if bytes_sent >= target:
            break


def _parse_range(range_header: str, total: int) -> Tuple[int, int]:
    """Parse 'bytes=X-Y' or 'bytes=X-' into (start, end)."""
    val   = range_header.replace("bytes=", "")
    parts = val.split("-")
    start = int(parts[0]) if parts[0] else 0
    end   = int(parts[1]) if len(parts) > 1 and parts[1] else total - 1
    return start, min(end, total - 1)


# ─── ENDPOINTS ────────────────────────────────────────────────

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {"service": "NexusEdu Backend", "status": "running"}


@app.api_route("/api/health", methods=["GET", "HEAD"])
async def health():
    telegram_status = "disconnected"
    try:
        if tg is not None:
            connected = getattr(tg, 'is_connected', False)
            telegram_status = "connected" if connected else "reconnecting"
    except Exception:
        telegram_status = "error"
    return JSONResponse({
        "status": "ok" if telegram_status == "connected" else "degraded",
        "telegram": telegram_status,
        "videos_cached": len(video_map),
        "messages_cached": len(message_cache),
        "channels_resolved": len(resolved_channels),
        "catalog_age_seconds": round(time.time() - catalog_cache["timestamp"]) if catalog_cache.get("timestamp") else None
    }, headers={"Access-Control-Allow-Origin": "*"})


@app.get("/api/debug")
async def debug(request: Request):
    admin_token = os.environ.get("ADMIN_TOKEN", "")
    if admin_token and request.headers.get("X-Admin-Token") != admin_token:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    info = {
        "telegram_connected":     False,
        "test_channel_resolved":  int(str(TEST_CHANNEL_ID)) in resolved_channels,
        "test_message_found":     False,
        "test_message_has_media": False,
        "resolved_channels":      [str(c) for c in resolved_channels],
        "channels_count":         len(resolved_channels),
        "videos_cached":          len(video_map),
        "messages_cached":        len(message_cache),
        "catalog_age_seconds":    (
            round(time.time() - catalog_cache["timestamp"])
            if catalog_cache["timestamp"] else None
        ),
        "catalog_loaded":         catalog_cache["data"] is not None,
        "errors":                 [],
    }
    try:
        info["telegram_connected"] = tg.is_connected
    except Exception as e:
        info["errors"].append(f"telegram check: {e}")
    try:
        await resolve_channel(TEST_CHANNEL_ID)
        info["test_channel_resolved"] = True
        msg = await get_message(TEST_CHANNEL_ID, TEST_MESSAGE_ID)
        if msg and not msg.empty:
            info["test_message_found"] = True
            media = msg.video or msg.document
            if media:
                info["test_message_has_media"] = True
                info["media_type"]   = "video" if msg.video else "document"
                info["file_size_mb"] = round(media.file_size / 1024 / 1024, 1)
    except Exception as e:
        info["errors"].append(f"message check: {e}")
    try:
        me = await tg.get_me()
        info["logged_in_as"] = f"{me.first_name} (ID: {me.id})"
    except Exception as e:
        info["errors"].append(f"get_me: {e}")
    return JSONResponse(info)


@app.get("/api/catalog")
async def catalog():
    now = time.time()
    if (catalog_cache["data"] is None
            or now - catalog_cache["timestamp"] > CATALOG_TTL):
        await refresh_catalog()
    return catalog_cache["data"] or {"subjects": [], "total_videos": 0}


_last_refresh_time = 0.0

@app.get("/api/refresh")
async def force_refresh():
    global _last_refresh_time
    now = time.time()
    if now - _last_refresh_time < 60:
        return {"status": "throttled", "retry_after": round(60 - (now - _last_refresh_time))}
    _last_refresh_time = now
    await refresh_catalog()
    return {"status": "refreshed", "videos": len(video_map)}


@app.get("/api/warmup")
async def warmup():
    """
    Called by frontend on app startup.
    Triggers immediate pre-warming of all video messages in background.
    """
    if video_map:
        asyncio.create_task(_prewarm_all(list(video_map.items())))
        return {"status": "warming", "videos": len(video_map)}
    await refresh_catalog()
    return {"status": "catalog_refreshed_and_warming", "videos": len(video_map)}


@app.get("/api/prefetch/{video_id}")
async def prefetch_video(video_id: str):
    """
    Warms the message cache for a single video without streaming bytes.
    Frontend calls this for every video when a chapter list loads,
    so by the time user taps play the message is already cached.
    """
    if video_id not in video_map:
        await refresh_catalog()
    if video_id not in video_map:
        return {"status": "not_found", "cached": False}

    info       = video_map[video_id]
    cid_str    = info.get("channel_id", "")
    message_id = info.get("message_id", 0)

    if not cid_str or not message_id:
        return {"status": "not_linked", "cached": False}

    key = f"{cid_str}_{message_id}"
    if key in message_cache:
        return {"status": "already_cached", "cached": True}

    try:
        cid = int(cid_str)
        await resolve_channel(cid)
        msg = await tg.get_messages(cid, message_id)
        if msg and not msg.empty:
            message_cache[key] = msg
            media = msg.video or msg.document
            size_mb = round(media.file_size / 1024 / 1024, 1) if media else 0
            return {"status": "cached", "cached": True, "size_mb": size_mb}
        return {"status": "message_empty", "cached": False}
    except Exception as e:
        return {"status": "error", "cached": False, "error": str(e)}


@app.api_route("/api/stream/{video_id}", methods=["GET", "HEAD"])
async def stream_video(video_id: str, request: Request):
    if video_id not in video_map:
        await refresh_catalog()
    if video_id not in video_map:
        raise HTTPException(404, "Video not found")

    connected = await ensure_telegram_connected()
    if not connected:
        raise HTTPException(503, 
            "Telegram client is not connected. "
            "The server is reconnecting. Please retry in 30 seconds.")

    info       = video_map[video_id]
    channel_id_str = info.get("channel_id", "")
    message_id_str = info.get("message_id", 0)

    if not channel_id_str or not message_id_str:
        raise HTTPException(400, "Video not linked to Telegram — set message_id in admin panel")

    channel_id = int(channel_id_str)
    message_id = int(message_id_str)

    await resolve_channel(channel_id)

    try:
        total, mime_type = await get_file_info(channel_id, message_id)
        if not total:
            raise HTTPException(500, "Could not read file size from Telegram")

        if mime_type != "video/mp4":
            print(f"[stream] WARNING: serving file as video/mp4 "
                  f"but actual format may differ for video {video_id}")

        print(f"Streaming video {video_id}, media_type: video/mp4, method: {request.method}")
        
        if request.method == "HEAD":
            return Response(
                status_code=200,
                media_type="video/mp4",
                headers={
                    "Content-Length": str(total),
                    "Accept-Ranges": "bytes",
                    "Content-Type": "video/mp4",
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Access-Control-Allow-Headers": "Range, Content-Type",
                    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
                }
            )

        range_header = request.headers.get("range")

        if range_header:
            # ── Seeking / subsequent request ──────────────────────
            start, end = _parse_range(range_header, total)
            length = end - start + 1
            return StreamingResponse(
                _stream_telegram(channel_id, message_id, start, end, total),
                status_code=206,
                media_type="video/mp4",
                headers={
                    "Content-Range":  f"bytes {start}-{end}/{total}",
                    "Content-Length": str(length),
                    "Accept-Ranges": "bytes",
                    "Content-Type": "video/mp4",
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Access-Control-Allow-Headers": "Range, Content-Type",
                    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
                },
            )
        else:
            # ── First request — return ONLY the first 512KB as HTTP 206 ──
            # This tells the browser the total file size (so seek bar works),
            # but only delivers 512KB so playback starts in under 1 second.
            # The browser then automatically sends Range requests for the rest.
            initial_end = min(total - 1, INITIAL_BUFFER - 1)
            length      = initial_end + 1
            return StreamingResponse(
                _stream_telegram(channel_id, message_id, 0, initial_end, total),
                status_code=206,
                media_type="video/mp4",
                headers={
                    "Content-Range":  f"bytes 0-{initial_end}/{total}",
                    "Content-Length": str(length),
                    "Accept-Ranges": "bytes",
                    "Content-Type": "video/mp4",
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Access-Control-Allow-Headers": "Range, Content-Type",
                    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
                },
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[NexusEdu] Stream error for {video_id}: {e}")
        raise HTTPException(500, f"Stream error: {e}")


@app.get("/api/test-stream")
async def test_stream(request: Request):
    """Streams the hardcoded test video — used for diagnostics."""
    await resolve_channel(TEST_CHANNEL_ID)
    try:
        total, mime_type = await get_file_info(TEST_CHANNEL_ID, TEST_MESSAGE_ID)
        if not total:
            raise HTTPException(500, "Test message has no media. Check channel.")

        range_header = request.headers.get("range")
        if range_header:
            start, end = _parse_range(range_header, total)
            length = end - start + 1
            return StreamingResponse(
                _stream_telegram(TEST_CHANNEL_ID, TEST_MESSAGE_ID, start, end, total),
                status_code=206,
                media_type="video/mp4",
                headers={
                    "Content-Range":  f"bytes {start}-{end}/{total}",
                    "Content-Length": str(length),
                    "Accept-Ranges": "bytes",
                    "Content-Type": "video/mp4",
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Access-Control-Allow-Headers": "Range, Content-Type",
                    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
                },
            )
        else:
            initial_end = min(total - 1, INITIAL_BUFFER - 1)
            length = initial_end + 1
            return StreamingResponse(
                _stream_telegram(TEST_CHANNEL_ID, TEST_MESSAGE_ID, 0, initial_end, total),
                status_code=206,
                media_type="video/mp4",
                headers={
                    "Content-Range":  f"bytes 0-{initial_end}/{total}",
                    "Content-Length": str(length),
                    "Accept-Ranges": "bytes",
                    "Content-Type": "video/mp4",
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Access-Control-Allow-Headers": "Range, Content-Type",
                    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
                },
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[NexusEdu] Test stream error: {e}")
        raise HTTPException(500, f"Test stream error: {e}")


# ─── RUN ──────────────────────────────────────────────────────
if __name__ == "__main__":
    print("[NexusEdu] Starting server on port 8080...")
    uvicorn.run(app, host="0.0.0.0", port=8080)
