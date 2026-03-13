const API_BASE_URL = 'http://localhost:8080';
const REQUEST_TIMEOUT_MS = 1200;

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

async function getOrCreateLocalUserId() {
  const existing = await chrome.storage.local.get('localUserId');
  if (existing.localUserId) {
    return existing.localUserId;
  }

  const newId = crypto.randomUUID();
  await chrome.storage.local.set({ localUserId: newId });
  return newId;
}

export async function analyzeRiskWithBackend({ site, passwordHash, structure, tokens, passwordLength }) {
  const userId = await getOrCreateLocalUserId();

  const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/risk/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      site,
      passwordHash,
      structure,
      tokens,
      passwordLength
    })
  }, REQUEST_TIMEOUT_MS);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Backend risk check failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  return data.risk;
}
