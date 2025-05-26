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
const QUIZ_APP_BASE_URL = "https://thinkify-quiz.vercel.app/";

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

// Thinkify Quiz Recommender - LinkedIn Content Script
class ThinkifyQuizRecommender {
  constructor() {
    this.quizDatabase = this.initializeQuizDatabase();
    this.currentRecommendations = [];
    this.widget = null;
    this.init();
  }

  // Initialize the quiz database with available quizzes
  initializeQuizDatabase() {
    return {
      'react': {
        title: 'React.js Fundamentals',
        description: 'Test your knowledge of React.js core concepts, components, hooks, and best practices',
        keywords: ['react', 'javascript', 'frontend', 'web development', 'ui', 'component', 'jsx', 'hooks'],
        url: '/quiz/react-quiz-001',
        difficulty: 'Intermediate',
        duration: '10 minutes'
      },
      'vue': {
        title: 'Vue.js Essentials',
        description: 'Comprehensive Vue.js quiz covering components, directives, and Vue ecosystem',
        keywords: ['vue', 'vuejs', 'javascript', 'frontend', 'web development', 'progressive framework'],
        url: '/quiz/vue-quiz-001',
        difficulty: 'Intermediate',
        duration: '10 minutes'
      },
      'angular': {
        title: 'Angular Framework Mastery',
        description: 'Deep dive into Angular concepts including components, services, and TypeScript',
        keywords: ['angular', 'typescript', 'frontend', 'web development', 'spa', 'framework'],
        url: '/quiz/angular-quiz-001',
        difficulty: 'Advanced',
        duration: '10 minutes'
      },
      'node': {
        title: 'Node.js Backend Development',
        description: 'Master Node.js fundamentals including event loop, modules, and Express.js',
        keywords: ['node', 'nodejs', 'javascript', 'backend', 'server', 'api', 'express', 'npm'],
        url: '/quiz/node-quiz-001',
        difficulty: 'Intermediate',
        duration: '10 minutes'
      },
      'django': {
        title: 'Django Web Framework',
        description: 'Comprehensive Django quiz covering models, views, templates, and ORM',
        keywords: ['django', 'python', 'backend', 'web framework', 'orm', 'mvc', 'web development'],
        url: '/quiz/django-quiz-001',
        difficulty: 'Intermediate',
        duration: '10 minutes'
      },
      'spring': {
        title: 'Spring Boot Framework',
        description: 'Explore Spring Boot concepts including auto-configuration and dependency injection',
        keywords: ['spring', 'springboot', 'java', 'backend', 'enterprise', 'microservices', 'api'],
        url: '/quiz/spring-quiz-001',
        difficulty: 'Advanced',
        duration: '10 minutes'
      },
      'python': {
        title: 'Python Programming Fundamentals',
        description: 'Test your Python skills and programming concepts',
        keywords: ['python', 'programming', 'scripting', 'data science', 'backend', 'development'],
        url: '/quiz/python-fundamentals',
        difficulty: 'Beginner',
        duration: '15 minutes'
      },
      'javascript': {
        title: 'JavaScript Core Concepts',
        description: 'Master JavaScript fundamentals and modern ES6+ features',
        keywords: ['javascript', 'js', 'frontend', 'programming', 'web development', 'es6'],
        url: '/quiz/javascript-core',
        difficulty: 'Intermediate',
        duration: '12 minutes'
      },
      'sql': {
        title: 'SQL Database Fundamentals',
        description: 'Test your knowledge of SQL queries, joins, and database design',
        keywords: ['sql', 'database', 'mysql', 'postgresql', 'queries', 'data', 'backend'],
        url: '/quiz/sql-fundamentals',
        difficulty: 'Intermediate',
        duration: '15 minutes'
      },
      'aws': {
        title: 'AWS Cloud Essentials',
        description: 'Learn AWS services and cloud computing fundamentals',
        keywords: ['aws', 'cloud', 'devops', 'infrastructure', 'ec2', 's3', 'lambda'],
        url: '/quiz/aws-essentials',
        difficulty: 'Intermediate',
        duration: '20 minutes'
      }
    };
  }

  // Initialize the extension
  init() {
    this.waitForPageLoad(() => {
      this.scanJobPage();
      this.setupPageObserver();
    });
  }

  // Wait for page to fully load
  waitForPageLoad(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  // Set up observer to detect page changes (LinkedIn SPA)
  setupPageObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldRescan = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if job content changed
          const hasJobContent = mutation.addedNodes && 
            Array.from(mutation.addedNodes).some(node => 
              node.nodeType === 1 && 
              (node.classList?.contains('jobs-search__job-details') ||
               node.classList?.contains('job-details-module'))
            );
          if (hasJobContent) {
            shouldRescan = true;
          }
        }
      });
      
      if (shouldRescan) {
        setTimeout(() => this.scanJobPage(), 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Main function to scan the job page
  scanJobPage() {
    const jobContent = this.extractJobContent();
    if (!jobContent) return;

    const keywords = this.extractKeywords(jobContent);
    const recommendations = this.findRelevantQuizzes(keywords);
    
    if (recommendations.length > 0) {
      this.showRecommendations(recommendations);
    }
  }

  // Extract job content from LinkedIn page
  extractJobContent() {
    const selectors = [
      '.jobs-search__job-details',
      '.job-details-module',
      '.jobs-description',
      '[data-job-id]',
      '.job-details-jobs-unified-top-card__content',
      '.jobs-unified-top-card__content'
    ];

    let jobElement = null;
    for (const selector of selectors) {
      jobElement = document.querySelector(selector);
      if (jobElement) break;
    }

    if (!jobElement) {
      console.log('Thinkify: No job content found');
      return null;
    }

    const title = this.getJobTitle();
    const description = this.getJobDescription();
    const requirements = this.getJobRequirements();

    return {
      title: title || '',
      description: description || '',
      requirements: requirements || '',
      fullText: jobElement.textContent || ''
    };
  }

  // Get job title from various possible selectors
  getJobTitle() {
    const titleSelectors = [
      '.jobs-unified-top-card__job-title',
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-search__job-details h1',
      '.job-details h1'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) return element.textContent.trim();
    }
    return null;
  }

  // Get job description
  getJobDescription() {
    const descSelectors = [
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.job-description',
      '[data-automation-id="jobPostingDescription"]'
    ];

    for (const selector of descSelectors) {
      const element = document.querySelector(selector);
      if (element) return element.textContent.trim();
    }
    return null;
  }

  // Get job requirements
  getJobRequirements() {
    const reqSelectors = [
      '.job-criteria',
      '.jobs-unified-top-card__job-insight',
      '.job-requirements'
    ];

    let requirements = '';
    for (const selector of reqSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        requirements += ' ' + el.textContent.trim();
      });
    }
    return requirements;
  }

  // Extract relevant keywords from job content
  extractKeywords(jobContent) {
    const text = `${jobContent.title} ${jobContent.description} ${jobContent.requirements}`.toLowerCase();
    
    const keywords = new Set();
    
    // Technology keywords
    const techKeywords = [
      'react', 'reactjs', 'vue', 'vuejs', 'angular', 'node', 'nodejs', 
      'django', 'spring', 'springboot', 'python', 'javascript', 'typescript',
      'java', 'sql', 'mysql', 'postgresql', 'mongodb', 'aws', 'cloud',
      'frontend', 'backend', 'fullstack', 'web development', 'api', 'rest',
      'graphql', 'microservices', 'devops', 'docker', 'kubernetes',
      'express', 'fastapi', 'flask', 'laravel', 'php', 'ruby', 'rails',
      'c#', 'dotnet', '.net', 'go', 'rust', 'kotlin', 'swift', 'ios',
      'android', 'mobile', 'react native', 'flutter', 'xamarin'
    ];

    // Check for exact matches and partial matches
    techKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.add(keyword);
      }
    });

    // Role-based keywords
    const roleKeywords = {
      'frontend': ['frontend', 'front-end', 'ui', 'user interface', 'client-side'],
      'backend': ['backend', 'back-end', 'server-side', 'api', 'database'],
      'fullstack': ['fullstack', 'full-stack', 'full stack'],
      'devops': ['devops', 'dev ops', 'infrastructure', 'deployment', 'ci/cd'],
      'mobile': ['mobile', 'ios', 'android', 'app development']
    };

    Object.entries(roleKeywords).forEach(([role, terms]) => {
      if (terms.some(term => text.includes(term))) {
        keywords.add(role);
      }
    });

    return Array.from(keywords);
  }

  // Find relevant quizzes based on keywords
  findRelevantQuizzes(keywords) {
    const recommendations = [];
    
    Object.entries(this.quizDatabase).forEach(([quizId, quiz]) => {
      let relevanceScore = 0;
      
      keywords.forEach(keyword => {
        if (quiz.keywords.some(qKeyword => 
          qKeyword.includes(keyword) || keyword.includes(qKeyword)
        )) {
          relevanceScore++;
        }
      });
      
      if (relevanceScore > 0) {
        recommendations.push({
          ...quiz,
          id: quizId,
          relevanceScore
        });
      }
    });

    // Sort by relevance score and return top 3
    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  }

  // Show quiz recommendations widget
  showRecommendations(recommendations) {
    this.currentRecommendations = recommendations;
    
    // Remove existing widget
    if (this.widget) {
      this.widget.remove();
    }

    // Create new widget
    this.widget = this.createWidget(recommendations);
    
    // Find a good place to insert the widget
    const insertLocation = this.findInsertLocation();
    if (insertLocation) {
      insertLocation.insertAdjacentElement('afterend', this.widget);
    } else {
      document.body.appendChild(this.widget);
    }
  }

  // Find appropriate location to insert widget
  findInsertLocation() {
    const selectors = [
      '.jobs-unified-top-card',
      '.job-details-jobs-unified-top-card',
      '.jobs-search__job-details',
      '.job-details-module'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    
    return null;
  }

  // Create the quiz recommendation widget
  createWidget(recommendations) {
    const widget = document.createElement('div');
    widget.className = 'thinkify-quiz-widget';
    widget.innerHTML = `
      <div class="thinkify-header">
        <div class="thinkify-logo">
          <span class="thinkify-icon">🎯</span>
          <span class="thinkify-brand">Thinkify</span>
        </div>
        <span class="thinkify-subtitle">Recommended Quizzes for This Job</span>
        <button class="thinkify-close" id="thinkifyClose">&times;</button>
      </div>
      <div class="thinkify-content">
        ${recommendations.map((quiz, index) => `
          <div class="thinkify-quiz-card" data-quiz-id="${quiz.id}">
            <div class="quiz-header">
              <h4 class="quiz-title">${quiz.title}</h4>
              <span class="quiz-difficulty ${quiz.difficulty.toLowerCase()}">${quiz.difficulty}</span>
            </div>
            <p class="quiz-description">${quiz.description}</p>
            <div class="quiz-meta">
              <span class="quiz-duration">⏱️ ${quiz.duration}</span>
              <span class="quiz-relevance">Match: ${this.getRelevanceText(quiz.relevanceScore)}</span>
            </div>
            <button class="quiz-take-btn" data-url="${quiz.url}" data-title="${quiz.title}">
              Take Quiz
            </button>
          </div>
        `).join('')}
      </div>
      <div class="thinkify-footer">
        <p>Powered by <a href="https://thinkify-quiz.vercel.app" target="_blank">Thinkify Quiz Platform</a></p>
      </div>
    `;

    // Add event listeners
    this.addWidgetEventListeners(widget);
    
    return widget;
  }

  // Add event listeners to widget
  addWidgetEventListeners(widget) {
    // Close button
    const closeBtn = widget.querySelector('#thinkifyClose');
    closeBtn.addEventListener('click', () => {
      widget.style.display = 'none';
    });

    // Quiz take buttons
    const takeButtons = widget.querySelectorAll('.quiz-take-btn');
    takeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.target.getAttribute('data-url');
        const title = e.target.getAttribute('data-title');
        this.openQuiz(url, title);
      });
    });

    // Card click handlers
    const cards = widget.querySelectorAll('.thinkify-quiz-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('quiz-take-btn')) {
          const btn = card.querySelector('.quiz-take-btn');
          btn.click();
        }
      });
    });
  }

  // Get relevance text based on score
  getRelevanceText(score) {
    if (score >= 3) return 'High';
    if (score >= 2) return 'Medium';
    return 'Low';
  }

  // Open quiz in new tab
  openQuiz(quizUrl, quizTitle) {
    const baseUrl = 'https://thinkify-quiz.vercel.app'; // Update with your actual domain
    const fullUrl = `${baseUrl}${quizUrl}`;
    
    // Track click event
    this.trackQuizClick(quizTitle);
    
    // Open in new tab
    window.open(fullUrl, '_blank');
  }

  // Track quiz click for analytics
  trackQuizClick(quizTitle) {
    // Store click data
    chrome.storage.local.get(['quizClicks'], (result) => {
      const clicks = result.quizClicks || [];
      clicks.push({
        quizTitle,
        timestamp: Date.now(),
        url: window.location.href
      });
      
      chrome.storage.local.set({ quizClicks: clicks });
    });
  }
}

// Initialize the extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ThinkifyQuizRecommender();
  });
} else {
  new ThinkifyQuizRecommender();
} 