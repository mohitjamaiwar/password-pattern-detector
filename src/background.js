// src/background.js

// Import all necessary modules
import { hashPassword } from '../modules/hashing.js';
import { structuredTokenize } from '../modules/tokenizer.js';
import { findOrCreateCluster, getClusters, saveClusters } from '../modules/cluserManager.js';
import { calculateRisk } from '../modules/riskScorer.js';
import { analyzeRiskWithBackend } from '../modules/backendRiskClient.js';

console.log("Background service worker started with clustering logic.");

// In-memory store for analysis results, keyed by tabId
const analysisResults = {};

// Main listener for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'passwordInput') {
    handlePasswordAnalysis(message.password, sender, message.site).catch((error) => {
      console.error('Password analysis failed:', error);
    });
    sendResponse({ status: "Password received for analysis." });
    return true;
  }
  if (message.type === 'getAnalysis') {
    sendResponse({ data: analysisResults[message.tabId] });
    return true;
  }
});

async function handlePasswordAnalysis(password, sender, siteFromMessage) {
  if (!password) return;

  const url = sender.url || (sender.tab && sender.tab.url) || sender.origin;
  let site = siteFromMessage;
  if (!site && url) {
    try {
      site = new URL(url).hostname;
    } catch (_error) {
      site = null;
    }
  }
  if (!site) return;

  console.log(`Analyzing password for site: ${site}`);

  // 1. Create fingerprint for the new password
  const passwordHash = await hashPassword(password);
  const tokens = structuredTokenize(password);
  const newFingerprint = {
    hash: passwordHash,
    structure: tokens.structure,
    tokens: { baseWord: tokens.baseWord, numbers: tokens.numbers, symbols: tokens.symbols }
  };

  // Try backend risk scoring first. If backend is unavailable, fall back to local clustering logic.
  let finalRisk = null;
  try {
    finalRisk = await analyzeRiskWithBackend({
      site,
      passwordHash,
      structure: tokens.structure,
      tokens: { baseWord: tokens.baseWord, numbers: tokens.numbers, symbols: tokens.symbols },
      passwordLength: password.length
    });
  } catch (error) {
    console.warn('Backend unavailable, using local risk analysis:', error);
  }

  if (!finalRisk) {
    // 2. Get existing clusters
    const existingClusters = await getClusters();

    // 3. Find or create a cluster and retrieve metrics
    const { updatedClusters, foundClusterId, similarityResults, exactMatches } = findOrCreateCluster(newFingerprint, site, existingClusters);
    
    // 4. Save the updated cluster structure
    await saveClusters(updatedClusters);
    console.log(`Password for ${site} placed in cluster: ${foundClusterId}`);

    // 5. Risk analysis
    finalRisk = calculateRisk(similarityResults, password.length, exactMatches);
  }

  // 6. Store result for popup and send update
  if (sender.tab && sender.tab.id) {
    analysisResults[sender.tab.id] = finalRisk;
    chrome.runtime.sendMessage({ type: 'analysisResult', data: finalRisk }).catch(() => {
      // Suppress error if popup is closed
    });

    // 7. Show warning badge if needed
    updateBadge(finalRisk, sender.tab.id);
  }
}


function updateBadge(risk, tabId) {
    let color = null;
    let text = '';
    if (risk.riskScore === 'CRITICAL' || risk.riskScore === 'HIGH') {
        color = [220, 53, 69, 255]; // #dc3545
        text = '!';
    } else if (risk.riskScore === 'MEDIUM') {
        color = [255, 193, 7, 255]; // #ffc107
        text = '!';
    }
    
    chrome.action.setBadgeText({ text, tabId });

    // Only set the color if it's not an empty string
    if (color) {
        chrome.action.setBadgeBackgroundColor({ color, tabId });
    }

    if (text) {
        chrome.alarms.create(`clearBadge_${tabId}`, { delayInMinutes: 1 });
    }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('clearBadge_')) {
    const tabId = parseInt(alarm.name.split('_')[1]);
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
});
