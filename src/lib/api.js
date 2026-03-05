const BASE_URL = "https://auracheck.fly.dev/api";
const TIMEOUT_MS = 8000;

export async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }

    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}
