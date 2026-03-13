// src/contentScript.js
// This script is injected into web pages to detect password fields.

console.log("Password Pattern Detector: Content script loaded.");

// Debounce function to limit how often a function is called.
function debounce(func, delay) {
  let timeout;
  const debounced = function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
}

// Function to send the password to the background script.
function sendPasswordForAnalysis(password) {
  if (password && password.length > 0) {
    const site = window.location.hostname;
    chrome.runtime.sendMessage({ type: "passwordInput", password: password, site }, (response) => {
      if (chrome.runtime.lastError) {
        // Handle error if the background script is not available
        console.error("Error sending password:", chrome.runtime.lastError.message);
      } else {
        console.log("Password sent for analysis.");
      }
    });
  }
}

// Debounced version of the analysis function.
const debouncedSendPassword = debounce(sendPasswordForAnalysis, 1000); // 1-second delay

// Function to handle events on password fields.
function handlePasswordInput(event) {
  const passwordField = event.target;
  if (passwordField.type === 'password') {
    debouncedSendPassword(passwordField.value);
  }
}

// Function to handle form submission.
function handleFormSubmission(event) {
    const form = event.target;
    const passwordField = form.querySelector('input[type="password"]');
    if (passwordField) {
        // Clear any pending debounced calls
        debouncedSendPassword.cancel(); 
        sendPasswordForAnalysis(passwordField.value);
    }
}

// Attach event listeners.
document.addEventListener('input', handlePasswordInput, true);
document.addEventListener('submit', handleFormSubmission, true);

