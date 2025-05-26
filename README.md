# 🧠 Thinkify Quiz Platform

A modern, interactive quiz platform built with Next.js 15, TypeScript, and Supabase. Empowering learning through comprehensive quizzes, courses, and creator tools.

## 🌟 Features

### 👨‍🎓 **For Learners**
- **Interactive Quiz Taking**: Engaging multiple-choice quizzes with instant feedback
- **Course Enrollment**: Browse and enroll in comprehensive learning paths
- **Progress Tracking**: Monitor your learning journey and achievements
- **Certificates**: Earn certificates upon successful quiz completion
- **Creator Discovery**: Find and follow your favorite quiz creators
- **LinkedIn Integration**: Sign in seamlessly with LinkedIn OAuth

### 👨‍🏫 **For Creators**
- **Quiz Creation**: Build engaging quizzes with our intuitive editor
- **Course Development**: Create structured learning paths with multiple quizzes
- **Analytics Dashboard**: Track student engagement and performance
- **Content Management**: Organize and manage your educational content
- **Student Insights**: View detailed statistics on quiz performance

### 🔧 **For Administrators**
- **User Management**: Comprehensive user and creator administration
- **Company Management**: Tier-based company system (Startup to FAANG)
- **Content Moderation**: Review and manage platform content
- **Analytics**: Platform-wide usage and performance metrics
- **Database Management**: Built-in database setup and migration tools

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + LinkedIn OAuth
- **Deployment**: Vercel
- **State Management**: React Context API
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 🚀 Live Demo

**Production**: [https://thinkify-quiz.vercel.app](https://thinkify-quiz.vercel.app)

### Demo Accounts
```
Regular User:
- Sign up at /auth/signup or use LinkedIn OAuth

Creator Account:
- Visit /auth/creator-signup to become a creator

Admin Access:
- Contact administrator for admin privileges
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- LinkedIn Developer Account (for OAuth)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/thinkify-quiz.git
cd thinkify-quiz
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Thinkify

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id

# Database
DATABASE_URL=your_database_connection_string

# NextAuth (if using)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3001
```

### 4. Database Setup

#### Option A: Use Built-in Setup (Recommended)
```bash
npm run dev
# Navigate to http://localhost:3001/admin/setup-database
# Follow the setup wizard
```

#### Option B: Manual Setup
```bash
# Run database migrations in Supabase SQL Editor
# See /docs/database/ for schema files
```

### 5. LinkedIn OAuth Configuration

1. **Create LinkedIn App**:
   - Go to [LinkedIn Developer Console](https://www.linkedin.com/developers/apps)
   - Create a new app
   - Add redirect URI: `http://localhost:3001/auth/linkedin/callback`

2. **Configure Scopes**:
   - Enable: `openid`, `profile`, `email`

3. **Update Environment**:
   - Add your LinkedIn Client ID and Secret to `.env.local`

### 6. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## 📁 Project Structure

```
thinkify-quiz/
├── src/
│   ├── app/                 # Next.js 15 App Router
│   │   ├── admin/          # Admin dashboard and management
│   │   ├── auth/           # Authentication pages
│   │   ├── creator/        # Creator dashboard and tools
│   │   ├── user/           # User dashboard and quiz taking
│   │   ├── api/            # API routes
│   │   └── components/     # Shared components
│   ├── lib/                # Utilities and configurations
│   │   ├── supabaseClient.ts
│   │   ├── authContext.tsx
│   │   └── utils/
│   └── components/         # Reusable UI components
├── docs/                   # Documentation
├── chrome-extension/       # LinkedIn Chrome Extension
├── public/                 # Static assets
└── sql/                   # Database schemas and migrations
```

## 🎯 Core Features Guide

### Quiz System
- **Multiple Choice**: Support for 2-6 answer options
- **Timed Quizzes**: Optional time limits
- **Instant Feedback**: Immediate results and explanations
- **Scoring**: Percentage-based scoring with pass/fail thresholds

### Course System
- **Multi-Quiz Courses**: Structured learning paths
- **Prerequisites**: Course dependency management
- **Progress Tracking**: Individual quiz and overall course progress
- **Certificates**: Automated certificate generation

### User Roles
- **Users**: Take quizzes, enroll in courses, view progress
- **Creators**: Create content, view analytics, manage students
- **Admins**: Platform management, user administration, content moderation

### Company Integration
- **Tier System**: 5-tier company classification
  - Tier 1: Startup
  - Tier 2: Growing Company
  - Tier 3: Mid-size Company
  - Tier 4: Large Tech Company
  - Tier 5: FAANG

## 🚀 Deployment

### Production Deployment (Vercel)

1. **Deploy to Vercel**:
   ```bash
   npm run build
   vercel --prod
   ```

2. **Environment Variables**:
   Set these in your Vercel dashboard:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id
   ```

3. **LinkedIn OAuth Update**:
   - Add production redirect URI: `https://your-domain.vercel.app/auth/linkedin/callback`

4. **Database Migration**:
   - Set up production Supabase project
   - Run database setup via `/admin/setup-database`

### Alternative Deployment Options
- **Netlify**: Supported with configuration
- **Railway**: Direct deployment from GitHub
- **Docker**: Containerized deployment (see Dockerfile)

## 🧪 Chrome Extension

The platform includes a companion Chrome extension that recommends relevant quizzes based on LinkedIn job postings.

### Features
- **Job Analysis**: Scans LinkedIn job descriptions
- **Smart Recommendations**: Matches skills to available quizzes
- **One-Click Access**: Direct links to platform quizzes

### Installation
```bash
cd chrome-extension
# Load as unpacked extension in Chrome Developer Mode
```

See [chrome-extension/README.md](chrome-extension/README.md) for detailed setup.

## 🧪 Testing

### Run Tests
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Manual Testing
- **Quiz Flow**: Create quiz → Take quiz → View results
- **Course Flow**: Create course → Enroll → Complete → Certificate
- **Auth Flow**: Sign up → Login → LinkedIn OAuth
- **Admin Flow**: User management → Content moderation

## 📊 Database Schema

### Core Tables
- **users**: User profiles and authentication
- **quizzes**: Quiz metadata and settings
- **questions**: Individual quiz questions
- **user_quiz_attempts**: Quiz attempt tracking
- **courses**: Course information
- **companies**: Company tier management

### Relationships
- Users ↔ Quiz Attempts (1:N)
- Courses ↔ Quizzes (1:N)
- Users ↔ Companies (N:1)

See [docs/database/](docs/database/) for complete schema documentation.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `POST /api/auth/linkedin/userinfo` - LinkedIn OAuth

### Quiz Endpoints
- `GET /api/quizzes` - List quizzes
- `POST /api/quizzes` - Create quiz
- `GET /api/quizzes/[id]` - Get quiz details
- `POST /api/quiz-attempts` - Submit quiz attempt

### Course Endpoints
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/[id]` - Get course details

## 🔒 Security

### Authentication
- **Supabase Auth**: Secure user authentication
- **Row Level Security**: Database-level access control
- **OAuth 2.0**: LinkedIn integration
- **JWT Tokens**: Secure session management

### Data Protection
- **Environment Variables**: Sensitive data protection
- **HTTPS Only**: Secure data transmission
- **Input Validation**: XSS and injection prevention
- **Rate Limiting**: API abuse prevention

## 🎨 UI/UX Features

### Design System
- **Consistent Components**: Reusable UI library
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Coming soon
- **Accessibility**: WCAG 2.1 compliance

### User Experience
- **Loading States**: Smooth transitions
- **Error Handling**: User-friendly error messages
- **Progress Indicators**: Clear progress tracking
- **Keyboard Navigation**: Full keyboard support

## 📈 Analytics & Monitoring

### Built-in Analytics
- **User Engagement**: Quiz completion rates
- **Performance Metrics**: Response times and success rates
- **Content Analytics**: Popular quizzes and courses
- **Creator Insights**: Detailed creator statistics

### Monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Core Web Vitals tracking
- **Uptime Monitoring**: Service availability

## 🔧 Configuration Options

### Feature Flags
```env
NEXT_PUBLIC_ENABLE_LINKEDIN_OAUTH=true
NEXT_PUBLIC_ENABLE_COURSES=true
NEXT_PUBLIC_ENABLE_CERTIFICATES=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Customization
- **Branding**: Logo, colors, and styling
- **Quiz Types**: Multiple choice, true/false, coding
- **Scoring**: Custom scoring algorithms
- **Certificates**: Custom certificate templates

## 📞 Support

### Getting Help
- **Documentation**: [docs/](docs/)
- **GitHub Issues**: [Report bugs and feature requests](https://github.com/your-username/thinkify-quiz/issues)
- **Email**: support@thinkify-quiz.com
- **Discord**: [Join our community](https://discord.gg/thinkify)

### Troubleshooting
- **Common Issues**: See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **FAQ**: [docs/FAQ.md](docs/FAQ.md)
- **Setup Problems**: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing framework
- **Supabase**: For the backend infrastructure
- **Vercel**: For seamless deployment
- **Tailwind CSS**: For the utility-first CSS framework
- **Contributors**: All the amazing people who helped build this

---

**Built with ❤️ for learners everywhere**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/thinkify-quiz)
[![Star on GitHub](https://img.shields.io/github/stars/your-username/thinkify-quiz?style=social)](https://github.com/your-username/thinkify-quiz)
