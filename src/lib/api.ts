const PRIMARY_BACKEND = import.meta.env.VITE_API_BASE_URL || 'https://nexusedu-backend-0bjq.onrender.com';
const REPLIT_BACKEND = import.meta.env.VITE_REPLIT_URL || '';
const BACKEND_CACHE_KEY = 'nexusedu_working_backend';
const BACKEND_CACHE_TTL = 5 * 60 * 1000;

// Compatible fetch with timeout — no AbortSignal.timeout (Bug N-063)
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, method: 'GET' });
  } finally {
    clearTimeout(timer);
  }
}

export async function getWorkingBackend(): Promise<string> {
  try {
    const cached = localStorage.getItem(BACKEND_CACHE_KEY);
    if (cached) {
      const { url, ts } = JSON.parse(cached);
      if (Date.now() - ts < BACKEND_CACHE_TTL) return url;
    }
  } catch {
    // ignore
  }
  
  try {
    const r = await fetchWithTimeout(`${PRIMARY_BACKEND}/api/health`, 6000);
    if (r.ok) {
      localStorage.setItem(BACKEND_CACHE_KEY, JSON.stringify({ url: PRIMARY_BACKEND, ts: Date.now() }));
      return PRIMARY_BACKEND;
    }
  } catch {
    // ignore
  }
  
  if (REPLIT_BACKEND) {
    try {
      const r = await fetchWithTimeout(`${REPLIT_BACKEND}/api/health`, 10000);
      if (r.ok) {
        localStorage.setItem(BACKEND_CACHE_KEY, JSON.stringify({ url: REPLIT_BACKEND, ts: Date.now() }));
        return REPLIT_BACKEND;
      }
    } catch {
      // ignore
    }
  }
  
  return PRIMARY_BACKEND;
}

export function clearBackendCache(): void {
  localStorage.removeItem(BACKEND_CACHE_KEY);
}

export async function getStreamUrl(videoId: string): Promise<string> {
  const backend = await getWorkingBackend();
  return `${backend}/api/stream/${videoId}`;
}

export async function prefetchVideo(videoId: string): Promise<void> {
  const backend = await getWorkingBackend();
  try { await fetchWithTimeout(`${backend}/api/prefetch/${videoId}`, 10000); } catch { /* ignore */ }
}

let lastRefreshTime = 0;
export async function refreshCatalog(): Promise<void> {
  // 60-second client-side cooldown matching backend cooldown
  if (Date.now() - lastRefreshTime < 60000) return;
  lastRefreshTime = Date.now();
  const backend = await getWorkingBackend();
  try { await fetchWithTimeout(`${backend}/api/refresh`, 15000); } catch { /* ignore */ }
}

export async function fetchBackendHealth(): Promise<Record<string, unknown>> {
  const backend = await getWorkingBackend();
  const r = await fetchWithTimeout(`${backend}/api/health`, 6000);
  return r.json();
}

export const api = {
  getWorkingBackend,
  clearBackendCache,
  getStreamUrl,
  prefetchVideo,
  refreshCatalog,
  fetchBackendHealth,
  getCatalogWithCache: async () => {
    const backend = await getWorkingBackend();
    const r = await fetchWithTimeout(`${backend}/api/catalog`, 10000);
    if (!r.ok) throw new Error('Failed to fetch catalog');
    return r.json();
  },
  warmup: async () => {
    const backend = await getWorkingBackend();
    try { await fetchWithTimeout(`${backend}/api/warmup`, 5000); } catch { /* ignore */ }
  }
};