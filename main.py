import asyncio
import math
import time
import os
from contextlib import asynccontextmanager
from typing import Optional, Tuple

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pyrogram import Client

# ─── CONFIG ───────────────────────────────────────────────────
API_ID          = int(os.environ.get("TELEGRAM_API_ID", "38432903"))
API_HASH        = os.environ.get("TELEGRAM_API_HASH", "c4d395153850472118de00e8c84aed54")
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
message_cache   = {}          # "channelid_msgid" → message object
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
    return message_cache[key]


async def get_file_info(channel_id: int, message_id: int) -> Tuple[int, str]:
    """
    Returns (file_size_bytes, mime_type).
    Videos uploaded as FILES in Telegram appear as 'document' —
    we detect this and force video/mp4 for browser playback.
    """
    msg = await get_message(channel_id, message_id)
    if msg.video:
        mime = msg.video.mime_type or "video/mp4"
        if "matroska" in mime.lower() or "mkv" in mime.lower():
            mime = "video/x-matroska"
        elif "video" not in mime.lower():
            mime = "video/mp4"
        return msg.video.file_size, mime
    if msg.document:
        mime = msg.document.mime_type or "video/mp4"
        if "matroska" in mime.lower() or "mkv" in mime.lower():
            mime = "video/x-matroska"
        elif "video" not in mime.lower():
            mime = "video/mp4"
        return msg.document.file_size, mime
    return 0, "video/mp4"


# ─── PRE-WARM (eliminates cold-start delay on first play) ─────
async def _prewarm_all(video_items: list):
    """
    Background task: pre-fetches ALL Telegram messages after catalog loads.
    After this completes, every video starts playing with zero Telegram delay.
    0.3s gap between fetches prevents Telegram rate-limiting.
    """
    total = len(video_items)
    if total == 0:
        return
    print(f"[NexusEdu] Pre-warming {total} message(s) in background...")
    fetched = 0
    for video_id, info in video_items:
        cid_str    = info.get("channel_id", "")
        message_id = info.get("message_id", 0)
        if not cid_str or not message_id:
            continue
        key = f"{cid_str}_{message_id}"
        if key in message_cache:
            continue
        try:
            cid = int(cid_str)
            await resolve_channel(cid)
            msg = await tg.get_messages(cid, message_id)
            if msg and not msg.empty:
                message_cache[key] = msg
                fetched += 1
        except Exception:
            pass
        await asyncio.sleep(0.3)
    print(f"[NexusEdu] Pre-warm done: {fetched}/{total} cached.")


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
    if not SESSION_STRING:
        print("[NexusEdu] PYROGRAM_SESSION_STRING is not set.")
        return False
        
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
    """
    Runs in background every 60 seconds.
    Reconnects Telegram if it drops.
    """
    while True:
        await asyncio.sleep(60)
        await ensure_telegram_connected()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global tg
    if not SESSION_STRING:
        print("[NexusEdu] WARNING: PYROGRAM_SESSION_STRING is not set. Telegram client will not start.")
    else:
        print("[NexusEdu] Starting Telegram client...")
        try:
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
        except Exception as e:
            print(f"[NexusEdu] Failed to start Telegram client: {e}")
            
    await refresh_catalog()
    asyncio.create_task(telegram_watchdog())
    yield
    if tg is not None:
        print("[NexusEdu] Stopping Telegram client...")
        try:
            await tg.stop()
        except Exception:
            pass


# ─── APP ──────────────────────────────────────────────────────
app = FastAPI(title="NexusEdu Backend", lifespan=lifespan)

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
    connected = tg is not None and tg.is_connected
    return {
        "status":              "ok" if connected else "degraded",
        "telegram":            "connected" if connected else "reconnecting",
        "videos_cached":       len(video_map),
        "messages_cached":     len(message_cache),
        "channels_resolved":   len(resolved_channels),
        "catalog_age_seconds": (
            round(time.time() - catalog_cache["timestamp"])
            if catalog_cache["timestamp"] else None
        ),
    }


@app.get("/api/debug")
async def debug():
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


@app.get("/api/refresh")
async def force_refresh():
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

    connected = await ensure_telegram_connected()
    if not connected:
        return {"status": "error", "cached": False, "error": "Telegram client is not connected"}

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


@app.get("/api/stream/{video_id}")
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
    channel_id = int(info["channel_id"])
    message_id = int(info["message_id"])

    if not channel_id or not message_id:
        raise HTTPException(400, "Video not linked to Telegram — set message_id in admin panel")

    await resolve_channel(channel_id)

    try:
        total, mime_type = await get_file_info(channel_id, message_id)
        if not total:
            raise HTTPException(500, "Could not read file size from Telegram")

        range_header = request.headers.get("range")

        if range_header:
            # ── Seeking / subsequent request ──────────────────────
            start, end = _parse_range(range_header, total)
            length = end - start + 1
            return StreamingResponse(
                _stream_telegram(channel_id, message_id, start, end, total),
                status_code=206,
                headers={
                    **CORS_HEADERS,
                    "Content-Range":  f"bytes {start}-{end}/{total}",
                    "Accept-Ranges":  "bytes",
                    "Content-Length": str(length),
                    "Content-Type":   mime_type,
                },
            )
        else:
            # ── First request without Range header ──
            return StreamingResponse(
                _stream_telegram(channel_id, message_id, 0, total - 1, total),
                status_code=200,
                headers={
                    **CORS_HEADERS,
                    "Accept-Ranges":  "bytes",
                    "Content-Length": str(total),
                    "Content-Type":   mime_type,
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
                headers={
                    **CORS_HEADERS,
                    "Content-Range":  f"bytes {start}-{end}/{total}",
                    "Accept-Ranges":  "bytes",
                    "Content-Length": str(length),
                    "Content-Type":   mime_type,
                },
            )
        else:
            return StreamingResponse(
                _stream_telegram(TEST_CHANNEL_ID, TEST_MESSAGE_ID, 0, total - 1, total),
                status_code=200,
                headers={
                    **CORS_HEADERS,
                    "Accept-Ranges":  "bytes",
                    "Content-Length": str(total),
                    "Content-Type":   mime_type,
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