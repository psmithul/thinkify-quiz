# Thinkify Quiz Recommender - Chrome Extension

A smart Chrome extension that scans LinkedIn job postings and recommends relevant quizzes from the Thinkify Quiz Platform to help users prepare for their target roles.

## Features

### 🎯 **Smart Job Analysis**
- Automatically detects when you're viewing LinkedIn job postings
- Scans job titles, descriptions, and requirements for relevant keywords
- Matches technologies and skills to available quizzes

### 📚 **Intelligent Quiz Recommendations**
- Shows top 3 most relevant quizzes for each job posting
- Displays difficulty level, duration, and relevance score
- Covers popular frameworks: React, Vue, Angular, Node.js, Django, Spring Boot
- Includes programming languages: JavaScript, Python, SQL
- Cloud technologies: AWS essentials

### 🚀 **Seamless Integration**
- Beautiful, non-intrusive widget that appears below job details
- One-click access to take recommended quizzes
- Direct links to Thinkify Quiz Platform
- Responsive design that works on all screen sizes

### 📊 **Analytics & Insights**
- Track your quiz-taking activity
- See which technologies you're most interested in
- Monitor your learning progress over time

## Installation

### Method 1: Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store for easy installation.

### Method 2: Developer Mode (Current)

1. **Download the Extension**
   ```bash
   # Clone or download the chrome-extension folder
   git clone <repository-url>
   cd chrome-extension
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - The extension should now appear in your extensions list

3. **Pin to Toolbar**
   - Click the extensions icon (puzzle piece) in Chrome toolbar
   - Pin "Thinkify Quiz Recommender" for easy access

## How It Works

### 1. **Browse LinkedIn Jobs**
- Visit any LinkedIn job posting (e.g., `linkedin.com/jobs/view/12345`)
- The extension automatically activates on job pages

### 2. **Get Recommendations**
- The extension scans the job content for technology keywords
- A beautiful widget appears with relevant quiz recommendations
- Each recommendation shows:
  - Quiz title and description
  - Difficulty level (Beginner/Intermediate/Advanced)
  - Estimated duration
  - Relevance match score

### 3. **Take Quizzes**
- Click "Take Quiz" to open the quiz on Thinkify platform
- Complete quizzes to improve your skills
- Earn certificates for successful completion

## Supported Technologies

The extension recognizes and recommends quizzes for:

**Frontend Frameworks:**
- React.js (Components, Hooks, JSX)
- Vue.js (Directives, Components, Vuex)
- Angular (TypeScript, Services, DI)

**Backend Technologies:**
- Node.js (Event Loop, Express, NPM)
- Django (Python, ORM, MTV)
- Spring Boot (Java, Auto-configuration)

**Programming Languages:**
- JavaScript (ES6+, Core concepts)
- Python (Fundamentals, Data structures)
- SQL (Queries, Joins, Database design)

**Cloud & DevOps:**
- AWS (EC2, S3, Lambda, Cloud essentials)

## Extension Settings

Access settings by clicking the extension icon in your toolbar:

### **Toggle Options:**
- **Enable Recommendations**: Turn the extension on/off
- **Show Relevance Score**: Display match percentage for each quiz

### **Analytics Dashboard:**
- View total quiz clicks
- See weekly activity
- Track most popular quiz categories
- Clear analytics data if needed

## Privacy & Data

- **No Personal Data Collection**: We don't collect LinkedIn profile information
- **Local Storage Only**: Analytics are stored locally in your browser
- **No Tracking**: We don't track your browsing outside of quiz interactions
- **Secure**: All communications use HTTPS

## Troubleshooting

### Extension Not Working?

1. **Check LinkedIn Page**: Ensure you're on a LinkedIn job posting page
2. **Refresh Page**: Try refreshing the LinkedIn page
3. **Check Extension Status**: Click the extension icon and ensure it's enabled
4. **Clear Cache**: Try clearing browser cache and reloading

### Widget Not Appearing?

1. **Page Loading**: Wait for the LinkedIn page to fully load
2. **Job Content**: Ensure the page has job description content
3. **Keywords**: The job might not contain recognized technology keywords
4. **Browser Compatibility**: Ensure you're using Chrome version 88+

### Quiz Links Not Working?

1. **Platform Status**: Check if thinkify-quiz.vercel.app is accessible
2. **Popup Blockers**: Ensure your browser allows popups from LinkedIn
3. **Network Issues**: Check your internet connection

## Development

### Project Structure
```
chrome-extension/
├── manifest.json          # Extension configuration
├── content.js             # Main content script (LinkedIn integration)
├── background.js          # Service worker for extension management
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── styles.css            # Widget and popup styles
├── icons/                # Extension icons (16px, 48px, 128px)
└── README.md            # This documentation
```

### Key Components

1. **Content Script (`content.js`)**
   - Scans LinkedIn job pages for content
   - Extracts keywords and matches to quiz database
   - Creates and displays recommendation widget
   - Handles user interactions

2. **Background Script (`background.js`)**
   - Manages extension lifecycle
   - Handles analytics and data storage
   - Processes settings updates
   - Manages tab state and badge updates

3. **Popup Interface (`popup.html/js`)**
   - Extension settings management
   - Analytics dashboard
   - Quick actions and links

### Local Development

1. **Make Changes**: Edit files in the chrome-extension folder
2. **Reload Extension**: Go to `chrome://extensions/` and click reload
3. **Test**: Visit LinkedIn job pages to test functionality
4. **Debug**: Use Chrome DevTools to inspect and debug

## Contributing

We welcome contributions! Here's how you can help:

1. **Report Issues**: Use the "Report Issue" button in the extension popup
2. **Suggest Features**: Email suggestions to support@thinkify-quiz.com
3. **Submit Pull Requests**: Fork the repository and submit improvements

## Support

### Need Help?
- **Email**: support@thinkify-quiz.com
- **Platform**: Visit [Thinkify Quiz Platform](https://thinkify-quiz.vercel.app)
- **Report Bug**: Use the extension's built-in report feature

### Changelog

**Version 1.0.0** (Current)
- Initial release
- LinkedIn job page scanning
- Quiz recommendations widget
- Analytics dashboard
- Settings management

## License

This extension is developed for the Thinkify Quiz Platform. All rights reserved.

---

**Happy Learning! 🎯📚**

Improve your job prospects by testing your skills with relevant quizzes matched to your target roles. 