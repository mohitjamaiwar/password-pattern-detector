// ui/popup.js
// Logic for the extension's popup UI.

document.addEventListener('DOMContentLoaded', () => {
  const reportDiv        = document.getElementById('report');
  const noActivityDiv    = document.getElementById('no-activity');
  const riskScoreSpan    = document.getElementById('risk-score');
  const numericScoreSpan = document.getElementById('numeric-score');
  const reasonsList      = document.getElementById('reasons-list');
  const heroCircle       = document.getElementById('hero-circle');
  const statusHeading    = document.getElementById('status-heading');
  const riskBadge        = document.getElementById('risk-badge');

  // Hide report until data arrives
  reportDiv.style.display = 'none';

  function updateUI(analysisData) {
    if (!analysisData) {
      reportDiv.style.display     = 'none';
      noActivityDiv.style.display = 'block';
      heroCircle.className        = 'hero-circle circle-blue';
      statusHeading.textContent   = 'Monitoring Active';
      statusHeading.style.color   = '#fff';
      return;
    }

    reportDiv.style.display     = 'block';
    noActivityDiv.style.display = 'none';

    // Risk label
    const level = analysisData.riskScore || 'LOW';
    riskScoreSpan.textContent = level;
    riskBadge.className = `flag-circle badge-${level.toLowerCase()}`;

    // Numeric score
    const numScore = analysisData.numericScore !== undefined ? analysisData.numericScore : 0;
    numericScoreSpan.textContent = numScore;

    // Hero circle & status heading
    if (numScore >= 8) {
      heroCircle.className      = 'hero-circle circle-red';
      statusHeading.textContent = 'Critical Risk Detected';
      statusHeading.style.color = '#ff5c5c';
    } else if (numScore >= 4) {
      heroCircle.className      = 'hero-circle circle-orange';
      statusHeading.textContent = 'Warning: Elevated Risk';
      statusHeading.style.color = '#ffbc4d';
    } else {
      heroCircle.className      = 'hero-circle circle-blue';
      statusHeading.textContent = 'Protection Active';
      statusHeading.style.color = '#fff';
    }

    // Reasons list
    reasonsList.innerHTML = '';
    const reasons = analysisData.reasons && analysisData.reasons.length
      ? analysisData.reasons
      : ['No immediate risks detected.'];
    reasons.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      reasonsList.appendChild(li);
    });
  }

  // Fetch stored result for this tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.id) {
      chrome.runtime.sendMessage({ type: 'getAnalysis', tabId: tab.id }, (response) => {
        if (!chrome.runtime.lastError && response && response.data) {
          updateUI(response.data);
        } else {
          updateUI(null);
        }
      });
    } else {
      updateUI(null);
    }
  });

  // Real-time updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'analysisResult' && message.data) {
      updateUI(message.data);
    }
  });
});

