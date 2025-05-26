// Popup script for Quiz App Job Companion

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadAnalytics();
  setupEventListeners();
});

// Load current settings
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    
    const enableToggle = document.getElementById('enableToggle');
    const relevanceToggle = document.getElementById('relevanceToggle');
    
    // Set toggle states
    if (response.isEnabled) {
      enableToggle.classList.add('active');
    }
    
    if (response.showRelevanceScore) {
      relevanceToggle.classList.add('active');
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showError('Failed to load settings');
  }
}

// Load analytics data
async function loadAnalytics() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getAnalytics' });
    
    // Update stats display
    document.getElementById('totalClicks').textContent = response.totalClicks || 0;
    document.getElementById('weekClicks').textContent = response.clicksThisWeek || 0;
    
    // Update quiz types
    const quizTypesContainer = document.getElementById('quizTypes');
    quizTypesContainer.innerHTML = '';
    
    if (response.quizTypeCounts && Object.keys(response.quizTypeCounts).length > 0) {
      Object.entries(response.quizTypeCounts)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .slice(0, 5) // Show top 5
        .forEach(([type, count]) => {
          const item = document.createElement('div');
          item.className = 'quiz-type-item';
          item.innerHTML = `
            <span class="quiz-type-name">${type}</span>
            <span class="quiz-type-count">${count}</span>
          `;
          quizTypesContainer.appendChild(item);
        });
    } else {
      const noData = document.createElement('div');
      noData.style.textAlign = 'center';
      noData.style.opacity = '0.6';
      noData.style.fontSize = '14px';
      noData.style.padding = '16px';
      noData.textContent = 'No quiz clicks yet';
      quizTypesContainer.appendChild(noData);
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    showError('Failed to load analytics');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Toggle switches
  document.getElementById('enableToggle').addEventListener('click', handleEnableToggle);
  document.getElementById('relevanceToggle').addEventListener('click', handleRelevanceToggle);
  
  // Buttons
  document.getElementById('clearAnalytics').addEventListener('click', handleClearAnalytics);
  document.getElementById('visitPlatform').addEventListener('click', handleVisitPlatform);
  document.getElementById('reportIssue').addEventListener('click', handleReportIssue);
}

// Handle enable toggle
async function handleEnableToggle() {
  const toggle = document.getElementById('enableToggle');
  const isEnabled = !toggle.classList.contains('active');
  
  try {
    await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: { isEnabled }
    });
    
    if (isEnabled) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
    
    // Show feedback
    showFeedback(isEnabled ? 'Recommendations enabled' : 'Recommendations disabled');
  } catch (error) {
    console.error('Error updating settings:', error);
    showError('Failed to update settings');
  }
}

// Handle relevance score toggle
async function handleRelevanceToggle() {
  const toggle = document.getElementById('relevanceToggle');
  const showRelevanceScore = !toggle.classList.contains('active');
  
  try {
    await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: { showRelevanceScore }
    });
    
    if (showRelevanceScore) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
    
    // Show feedback
    showFeedback(showRelevanceScore ? 'Relevance score enabled' : 'Relevance score disabled');
  } catch (error) {
    console.error('Error updating settings:', error);
    showError('Failed to update settings');
  }
}

// Handle clear analytics
async function handleClearAnalytics() {
  if (!confirm('Are you sure you want to clear all analytics data?')) {
    return;
  }
  
  try {
    await chrome.runtime.sendMessage({ action: 'clearAnalytics' });
    await loadAnalytics(); // Reload to show cleared state
    showFeedback('Analytics data cleared');
  } catch (error) {
    console.error('Error clearing analytics:', error);
    showError('Failed to clear analytics');
  }
}

// Handle visit platform
function handleVisitPlatform() {
  chrome.tabs.create({
    url: 'https://thinkify-quiz.vercel.app/user/dashboard'
  });
}

// Handle report issue
function handleReportIssue() {
  const subject = encodeURIComponent('Thinkify Chrome Extension - Issue Report');
  const body = encodeURIComponent(`
Extension Version: 1.0
Browser: ${navigator.userAgent}

Issue Description:
[Please describe the issue you're experiencing]

Steps to Reproduce:
1. 
2. 
3. 

Expected Behavior:
[What you expected to happen]

Actual Behavior:
[What actually happened]
  `);
  
  chrome.tabs.create({
    url: `mailto:support@thinkify-quiz.com?subject=${subject}&body=${body}`
  });
}

// Show error message
function showError(message) {
  removeExistingFeedback();
  
  const error = document.createElement('div');
  error.className = 'error';
  error.textContent = message;
  
  const content = document.querySelector('.content');
  content.insertBefore(error, content.firstChild);
  
  setTimeout(() => {
    error.remove();
  }, 5000);
}

// Show feedback message
function showFeedback(message) {
  removeExistingFeedback();
  
  const feedback = document.createElement('div');
  feedback.style.cssText = `
    background: rgba(72, 187, 120, 0.2);
    color: #68d391;
    padding: 12px;
    border-radius: 6px;
    font-size: 14px;
    margin-bottom: 16px;
  `;
  feedback.textContent = message;
  
  const content = document.querySelector('.content');
  content.insertBefore(feedback, content.firstChild);
  
  setTimeout(() => {
    feedback.remove();
  }, 3000);
}

// Remove existing feedback messages
function removeExistingFeedback() {
  const existing = document.querySelector('.error');
  if (existing) {
    existing.remove();
  }
  
  // Remove any success feedback
  const successFeedback = document.querySelector('[style*="rgba(72, 187, 120"]');
  if (successFeedback) {
    successFeedback.remove();
  }
}

// Handle extension communication errors
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'error') {
    showError(message.message);
  }
});

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.close();
  }
  
  if (e.key === 'Enter') {
    const focused = document.activeElement;
    if (focused && focused.classList.contains('toggle-switch')) {
      focused.click();
    }
  }
});

// Make toggle switches accessible
document.querySelectorAll('.toggle-switch').forEach(toggle => {
  toggle.setAttribute('tabindex', '0');
  toggle.setAttribute('role', 'switch');
  
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle.click();
    }
  });
  
  // Update aria-checked when clicked
  toggle.addEventListener('click', () => {
    setTimeout(() => {
      const isActive = toggle.classList.contains('active');
      toggle.setAttribute('aria-checked', isActive);
    }, 0);
  });
});

// Helper function to update the base URL when the app is deployed to a different domain
function updateAppBaseUrl(newUrl) {
  chrome.storage.sync.set({ appBaseUrl: newUrl }, () => {
    console.log('App base URL updated to:', newUrl);
  });
} 