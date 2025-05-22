// Background script for Quiz App Job Companion

// Run when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Quiz App Job Companion installed');
  
  // Initialize storage with default settings
  chrome.storage.sync.set({
    enabled: true,
    quizUrls: {
      "react-quiz": "react-fundamentals-quiz",
      "js-quiz": "javascript-core-concepts",
      "angular-quiz": "angular-essentials"
    }
  });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only proceed if the URL contains LinkedIn jobs
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('linkedin.com/jobs')) {
    chrome.storage.sync.get('enabled', (data) => {
      if (data.enabled) {
        // Notify the content script to check for job listings
        chrome.tabs.sendMessage(tabId, { action: 'checkForJobs' })
          .catch(err => {
            // Content script might not be loaded yet, which is expected
            console.log('Could not send message to tab', err);
          });
      }
    });
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getStatus') {
    chrome.storage.sync.get('enabled', (data) => {
      sendResponse({ enabled: data.enabled });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'toggleEnabled') {
    chrome.storage.sync.set({ enabled: message.enabled }, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'updateQuizUrls') {
    chrome.storage.sync.set({ quizUrls: message.quizUrls }, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
}); 