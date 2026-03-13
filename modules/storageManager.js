// modules/storageManager.js
// Manages storing and retrieving password fingerprints from local storage.

/**
 * Saves a password fingerprint to chrome.storage.local.
 * The site URL is used as the key.
 *
 * @param {string} site The website URL (e.g., "example.com").
 * @param {object} fingerprint The password fingerprint object.
 * @param {string} fingerprint.hash The hashed password.
 * @param {string} fingerprint.structure The password's structure (e.g., "[word][symbol][number]").
 * @param {object} fingerprint.tokens The tokenized parts of the password.
 */
export async function savePasswordFingerprint(site, fingerprint) {
  const dataToStore = {
    [site]: {
      ...fingerprint,
      timestamp: Date.now()
    }
  };
  try {
    await chrome.storage.local.set(dataToStore);
    console.log(`Fingerprint saved for ${site}.`);
  } catch (error) {
    console.error(`Error saving fingerprint for ${site}:`, error);
  }
}

/**
 * Retrieves all stored password fingerprints from chrome.storage.local.
 *
 * @returns {Promise<object>} A promise that resolves to an object containing
 *                            all stored password data, keyed by site.
 */
export async function getStoredPasswords() {
  try {
    const allData = await chrome.storage.local.get(null);
    return allData;
  } catch (error) {
    console.error("Error retrieving stored passwords:", error);
    return {};
  }
}
