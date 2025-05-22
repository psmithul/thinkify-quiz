// Quiz App Integration Content Script

// Configuration for quiz topics and corresponding quiz IDs on our platform
const QUIZ_MAPPINGS = {
  "react": {
    keywords: ["react", "reactjs", "react.js", "frontend"],
    quizName: "React Fundamentals Quiz",
    quizId: "react-quiz"
  },
  "javascript": {
    keywords: ["javascript", "js", "frontend", "web developer", "frontend developer"],
    quizName: "JavaScript Core Concepts",
    quizId: "js-quiz"
  },
  "angular": {
    keywords: ["angular", "angularjs", "frontend framework"],
    quizName: "Angular Essentials",
    quizId: "angular-quiz"
  }
};

// URL for the quiz app
const QUIZ_APP_BASE_URL = "http://localhost:3000";

// Helper function to detect job skills from the page
function detectJobSkills() {
  // Get job title and description
  const jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.toLowerCase() || '';
  const jobDescription = document.querySelector('.jobs-description-content')?.textContent?.toLowerCase() || '';
  
  // Combine for text analysis
  const combinedText = `${jobTitle} ${jobDescription}`;
  
  // Check for matches with our quiz topics
  const matchedQuizzes = [];
  
  Object.values(QUIZ_MAPPINGS).forEach(quiz => {
    if (quiz.keywords.some(keyword => combinedText.includes(keyword))) {
      matchedQuizzes.push(quiz);
    }
  });
  
  return matchedQuizzes;
}

// Function to create and inject the quiz suggestion UI
function injectQuizSuggestion(matchedQuizzes) {
  if (matchedQuizzes.length === 0) return;
  
  // Remove any existing quiz suggestion
  const existingBox = document.getElementById('quiz-app-suggestion');
  if (existingBox) existingBox.remove();
  
  // Create the suggestion box
  const suggestionBox = document.createElement('div');
  suggestionBox.id = 'quiz-app-suggestion';
  suggestionBox.className = 'quiz-app-box';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'quiz-app-header';
  header.textContent = 'Test Your Skills';
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.className = 'quiz-app-close';
  closeButton.addEventListener('click', () => suggestionBox.remove());
  header.appendChild(closeButton);
  
  // Create content
  const content = document.createElement('div');
  content.className = 'quiz-app-content';
  
  // Add description
  const description = document.createElement('p');
  description.textContent = 'Improve your chances by testing your knowledge with these relevant quizzes:';
  content.appendChild(description);
  
  // Add quiz list
  const quizList = document.createElement('ul');
  matchedQuizzes.forEach(quiz => {
    const quizItem = document.createElement('li');
    const quizLink = document.createElement('a');
    quizLink.href = `${QUIZ_APP_BASE_URL}/user/quiz/${quiz.quizId}`;
    quizLink.textContent = quiz.quizName;
    quizLink.target = '_blank';
    quizItem.appendChild(quizLink);
    quizList.appendChild(quizItem);
  });
  content.appendChild(quizList);
  
  // Assemble the box
  suggestionBox.appendChild(header);
  suggestionBox.appendChild(content);
  
  // Find a good place to inject in the LinkedIn UI
  const targetElement = document.querySelector('.jobs-unified-top-card__content--two-pane') || 
                      document.querySelector('.jobs-search__job-details--container');
  
  if (targetElement) {
    targetElement.appendChild(suggestionBox);
  } else {
    // Fallback - add to the body
    document.body.appendChild(suggestionBox);
  }
}

// Main function to run when page loads or changes
function checkForJobListing() {
  // Check if we're on a job details page
  const isJobPage = window.location.href.includes('/jobs/view/') || 
                   document.querySelector('.job-details-jobs-unified-top-card__job-title');
  
  if (isJobPage) {
    console.log('Quiz App: Job listing detected');
    
    // Wait a bit for the page to fully load
    setTimeout(() => {
      const matchedQuizzes = detectJobSkills();
      if (matchedQuizzes.length > 0) {
        console.log('Quiz App: Relevant quizzes found', matchedQuizzes);
        injectQuizSuggestion(matchedQuizzes);
      }
    }, 1500);
  }
}

// Initialize
checkForJobListing();

// Set up a mutation observer to detect changes in the LinkedIn page
// This handles LinkedIn's SPA navigation
const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes.length) {
      checkForJobListing();
    }
  }
});

// Start observing the document
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkForJobs') {
    checkForJobListing();
    sendResponse({success: true});
  }
}); 