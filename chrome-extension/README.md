# Quiz App Job Companion Chrome Extension

This Chrome extension integrates with LinkedIn job listings to suggest relevant quizzes from our Quiz App platform.

## Features

- Automatically detects when you're viewing job listings on LinkedIn
- Analyzes job descriptions to identify required skills
- Suggests relevant quizzes from our platform based on the job requirements
- Allows easy access to quizzes with a single click
- Provides settings to enable/disable the suggestions

## Installation

### Development Mode

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right
4. Click "Load unpacked" and select the `chrome-extension` directory
5. The extension should now be installed and active

### From Chrome Web Store (Coming Soon)

1. Visit the Chrome Web Store
2. Search for "Quiz App Job Companion"
3. Click "Add to Chrome"

## Usage

1. Visit LinkedIn and browse job listings
2. When viewing a job that matches our available quiz topics (React, JavaScript, Angular), a suggestion box will appear
3. Click on any suggested quiz to take it and improve your skills
4. Use the extension popup to configure settings or access all quizzes

## Configuration

Click the extension icon in the toolbar to:

- Enable/disable quiz suggestions
- View available quizzes
- Access your Quiz App dashboard

## Development

### Directory Structure

- `manifest.json` - Extension configuration
- `background.js` - Background service worker
- `content.js` - Content script injected into LinkedIn pages
- `content.css` - Styles for the injected content
- `popup.html` - Extension popup UI
- `popup.js` - JavaScript for the popup
- `images/` - Icons and images

### Local Development Setup

1. Make sure your Quiz App is running locally (default: http://localhost:3000)
2. Make any changes to the extension code
3. Reload the extension from the Chrome extensions page

## License

MIT 