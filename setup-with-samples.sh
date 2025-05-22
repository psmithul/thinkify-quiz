#!/bin/bash

# Run the database setup
echo "Setting up database tables and permissions..."
npm run init-db

# Run the sample quizzes script
echo "Creating sample quizzes..."
node scripts/create-sample-quizzes.js

echo "✅ Setup complete! Sample quizzes for React, Angular, and JavaScript have been created."
echo "You can now start the application with: npm run dev" 