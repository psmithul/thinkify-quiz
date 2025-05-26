// Thinkify Quiz Recommender - Background Service Worker

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Thinkify Quiz Recommender installed/updated');
  
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.local.set({
      isEnabled: true,
      showRelevanceScore: true,
      maxRecommendations: 3,
      quizClicks: []
    });
    
    // Open welcome page
    chrome.tabs.create({
      url: 'https://thinkify-quiz.vercel.app/welcome-extension'
    });
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSettings':
      chrome.storage.local.get(['isEnabled', 'showRelevanceScore', 'maxRecommendations'], (result) => {
        sendResponse(result);
      });
      return true; // Will respond asynchronously
      
    case 'updateSettings':
      chrome.storage.local.set(request.settings, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'getAnalytics':
      chrome.storage.local.get(['quizClicks'], (result) => {
        const clicks = result.quizClicks || [];
        const analytics = processAnalytics(clicks);
        sendResponse(analytics);
      });
      return true;
      
    case 'clearAnalytics':
      chrome.storage.local.set({ quizClicks: [] }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Process analytics data
function processAnalytics(clicks) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;
  const monthMs = 30 * dayMs;
  
  const today = clicks.filter(click => now - click.timestamp < dayMs);
  const thisWeek = clicks.filter(click => now - click.timestamp < weekMs);
  const thisMonth = clicks.filter(click => now - click.timestamp < monthMs);
  
  // Count quiz types
  const quizTypeCounts = {};
  clicks.forEach(click => {
    const type = extractQuizType(click.quizTitle);
    quizTypeCounts[type] = (quizTypeCounts[type] || 0) + 1;
  });
  
  return {
    totalClicks: clicks.length,
    clicksToday: today.length,
    clicksThisWeek: thisWeek.length,
    clicksThisMonth: thisMonth.length,
    quizTypeCounts,
    lastUpdated: now
  };
}

// Extract quiz type from title
function extractQuizType(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('react')) return 'React';
  if (lowerTitle.includes('vue')) return 'Vue.js';
  if (lowerTitle.includes('angular')) return 'Angular';
  if (lowerTitle.includes('node')) return 'Node.js';
  if (lowerTitle.includes('django')) return 'Django';
  if (lowerTitle.includes('spring')) return 'Spring Boot';
  if (lowerTitle.includes('python')) return 'Python';
  if (lowerTitle.includes('javascript')) return 'JavaScript';
  if (lowerTitle.includes('sql')) return 'SQL';
  if (lowerTitle.includes('aws')) return 'AWS';
  return 'Other';
}

// Handle tab updates to detect LinkedIn job pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isLinkedInJob = tab.url.includes('linkedin.com/jobs/');
    
    if (isLinkedInJob) {
      // Update badge to show extension is active
      chrome.action.setBadgeText({
        text: '🎯',
        tabId: tabId
      });
      
      chrome.action.setBadgeBackgroundColor({
        color: '#667eea'
      });
    } else {
      // Clear badge for non-job pages
      chrome.action.setBadgeText({
        text: '',
        tabId: tabId
      });
    }
  }
});

// Alarm for periodic cleanup
chrome.alarms.create('cleanupAnalytics', { periodInMinutes: 60 * 24 }); // Daily

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanupAnalytics') {
    cleanupOldAnalytics();
  }
});

// Clean up analytics data older than 3 months
function cleanupOldAnalytics() {
  chrome.storage.local.get(['quizClicks'], (result) => {
    const clicks = result.quizClicks || [];
    const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    
    const recentClicks = clicks.filter(click => click.timestamp > threeMonthsAgo);
    
    chrome.storage.local.set({ quizClicks: recentClicks });
  });
} 