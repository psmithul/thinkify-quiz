// Popup script for Quiz App Job Companion

document.addEventListener('DOMContentLoaded', () => {
  const enableToggle = document.getElementById('enableToggle');
  
  // Load initial state
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (response && response.enabled !== undefined) {
      enableToggle.checked = response.enabled;
    }
  });
  
  // Handle toggle changes
  enableToggle.addEventListener('change', () => {
    const enabled = enableToggle.checked;
    chrome.runtime.sendMessage({ 
      action: 'toggleEnabled', 
      enabled: enabled 
    });
  });
  
  // Get the URLs for the buttons to link to specific quizzes
  chrome.storage.sync.get('quizUrls', (data) => {
    if (data.quizUrls) {
      // Update URLs here if needed
      console.log('Quiz URLs loaded:', data.quizUrls);
    }
  });
});

// Helper function to update the base URL when the app is deployed to a different domain
function updateAppBaseUrl(newUrl) {
  chrome.storage.sync.set({ appBaseUrl: newUrl }, () => {
    console.log('App base URL updated to:', newUrl);
  });
} 