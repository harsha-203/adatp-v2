# Edubox LMS - AI-Powered Learning Management System

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)](https://www.typescriptlang.org/)

A comprehensive, production-ready Learning Management System featuring gamification, certificate generation, AI-powered recommendations, discussion forums, live video sessions, and integrated payment processing.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ and Yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/harsha-203/adatp-v2.git
cd adatp-v2
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
yarn install
```

4. **Environment Configuration**

Create `.env` file in `/backend`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
EMERGENT_LLM_KEY=your_emergent_llm_key
STRIPE_SECRET_KEY=your_stripe_key  # Optional
DAILY_API_KEY=your_daily_api_key   # Optional
CORS_ORIGINS=*
```

Create `.env` file in `/frontend`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_BACKEND_URL=http://localhost:8001
```

5. **Build and Run**

Backend:
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Frontend:
```bash
cd frontend
yarn build  # Build for production
yarn start  # Start production server
# OR
yarn dev    # Start development server
```

Access the application at `http://localhost:3000`

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3.4
- **UI Components**: Shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Video Player**: ReactPlayer
- **State Management**: React Context API

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PDF Generation**: ReportLab
- **HTTP Client**: HTTPX
- **Validation**: Pydantic
- **AI Integration**: Emergent LLM

### Key Integrations
- **AI**: Emergent LLM for AI-powered recommendations
- **Payments**: Stripe (optional)
- **Video**: Daily.co for live sessions (optional)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage for profile photos

---

## ✨ Features Overview

### 🎯 Core Features

#### 📚 Course Management
- Browse courses with advanced filtering (Category, Difficulty, Search)
- Detailed course pages with curriculum
- Course enrollment and progress tracking
- Video-based learning with ReactPlayer
- Quiz and assessment system
- Course completion certificates

#### 👨‍🎓 Student Dashboard
- **Main Dashboard**: 
  - Real-time statistics (8 stat cards)
  - Three-tab system: My Learning, AI Insights, Recent Activity
  - Continue learning quick access
  
- **My Courses**: Enrolled courses with progress tracking
- **Progress Tracker**: Detailed analytics and metrics
- **Achievements**: Gamification with badges and points
- **Leaderboard**: Student rankings and competition
- **Certificates**: View and download PDF certificates
- **AI Learning**: 
  - AI-powered course recommendations
  - Personalized learning path generator

#### 🛒 E-Commerce Features
- **Unified Cart & Purchases**: 
  - Tab 1: Shopping cart with checkout
  - Tab 2: Purchase history
  - Seamless user experience
- **Payment Integration**: Stripe payment processing
- **Payment History**: Transaction records

#### 💬 Community Features
- **Forums**: Course-specific discussion forums
- **Threads**: Topic-based discussions
- **User Profiles**: Profile photos and student IDs

#### 📹 Live Learning
- **Live Sessions**: Video conferencing integration
- **Session Management**: Schedule and join live classes
- **Recording Access**: Access to past session recordings

#### 🎓 Additional Features
- **Practice Mode**: Interactive quiz practice
- **Tutorials**: Step-by-step learning guides
- **Student Analytics**: Comprehensive learning analytics
- **Profile Settings**: 
  - Profile photo upload
  - Student ID management
  - Notification preferences

### 🏠 Landing Page
Complete marketing page with:
- Hero section with 30-day free trial badge
- Course category cards (Language, Graphic Design, Content Writing, Finance)
- Statistics banner (260K+ students, 24+ years experience)
- Popular courses showcase
- Student testimonials
- Instructor team profiles
- Lifetime access CTA section
- Responsive design

### 👨‍💼 Admin Features
- Course creation and management
- User management
- Quiz generator
- Live session scheduling
- Analytics dashboard

---

## 📁 Project Structure

```
adatp-v2/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── ai_service.py          # AI integration service
│   ├── forum_service.py       # Forum functionality
│   ├── live_session_service.py # Video session management
│   ├── payment_service.py     # Stripe integration
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
│
├── frontend/
│   ├── app/                   # Next.js app directory
│   │   ├── page.tsx          # Landing page
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Student dashboard
│   │   ├── courses/          # Course pages
│   │   ├── cart/             # Cart & Purchases (unified)
│   │   ├── forums/           # Discussion forums
│   │   ├── live-sessions/    # Live video sessions
│   │   ├── onboarding/       # New user onboarding
│   │   └── student/          # Student analytics
│   │
│   ├── components/
│   │   ├── dashboard/        # Dashboard components
│   │   ├── ui/              # Shadcn UI components
│   │   └── protected-route.tsx
│   │
│   ├── lib/
│   │   ├── auth-context.tsx  # Authentication context
│   │   ├── supabase.ts       # Supabase client
│   │   └── utils.ts          # Utility functions
│   │
│   ├── package.json          # Node dependencies
│   └── .env                  # Frontend environment variables
│
└── README.md                 # This file
```

---

## 🔑 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
EMERGENT_LLM_KEY=your_emergent_llm_key
STRIPE_SECRET_KEY=sk_test_xxx  # Optional
DAILY_API_KEY=your_daily_api_key  # Optional
CORS_ORIGINS=*
```

### Frontend (.env)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=443  # For WebSocket connections
```

---

## 🗄️ Database Setup

The application uses Supabase (PostgreSQL) with the following main tables:

- **users**: User profiles and authentication
- **courses**: Course information
- **enrollments**: Student course enrollments
- **progress**: Learning progress tracking
- **quizzes**: Quiz questions and answers
- **achievements**: Gamification badges
- **certificates**: Course completion certificates
- **forums**: Discussion forum data
- **cart**: Shopping cart items
- **purchases**: Purchase transactions
- **live_sessions**: Video session scheduling

---

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Dark Mode Ready**: Prepared for dark theme
- **Accessible**: WCAG compliant components
- **Modern UI**: Clean, professional interface
- **Fast Performance**: Optimized Next.js build
- **SEO Optimized**: Meta tags and sitemap

---

## 🔒 Security Features

- Supabase Row Level Security (RLS)
- JWT-based authentication
- Environment variable protection
- CORS configuration
- Input validation with Zod
- SQL injection prevention
- XSS protection

---

## 📱 Key Pages & Routes

### Public Routes
- `/` - Landing page
- `/auth/signin` - Sign in
- `/auth/signup` - Sign up
- `/courses` - Browse courses
- `/courses/[id]` - Course details

### Protected Routes (Student)
- `/dashboard` - Main dashboard
- `/dashboard/my-courses` - Enrolled courses
- `/dashboard/progress` - Progress tracking
- `/dashboard/achievements` - Badges & rewards
- `/dashboard/certificates` - Certificates
- `/dashboard/ai-recommendations` - AI Learning
- `/dashboard/leaderboard` - Rankings
- `/dashboard/settings` - User settings
- `/cart` - Cart & Purchases (unified)
- `/forums` - Discussion forums
- `/live-sessions` - Video sessions
- `/student/analytics` - Learning analytics
- `/practice` - Practice quizzes
- `/onboarding` - New user setup

### Admin Routes
- `/admin/dashboard` - Admin overview
- `/admin/courses` - Course management
- `/admin/live-sessions` - Session management
- `/admin/quiz-generator` - Quiz creation

---

## 🚀 Deployment

### Prerequisites for Deployment
1. Supabase project (free tier available)
2. Domain name (optional)
3. Node.js hosting (Vercel, Netlify, etc.)
4. Python hosting (Railway, Render, AWS, etc.)

### Deployment Steps

1. **Backend Deployment**
   - Deploy FastAPI to your preferred platform
   - Set environment variables
   - Ensure port 8001 is accessible

2. **Frontend Deployment**
   - Build: `yarn build`
   - Deploy to Vercel/Netlify
   - Update `REACT_APP_BACKEND_URL` to production backend URL

3. **Database Migration**
   - Run migration scripts on Supabase
   - Enable RLS policies
   - Set up storage buckets for profile photos

---

## 🛠️ Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests (if configured)
cd frontend
yarn test
```

### Code Quality
```bash
# Frontend linting
cd frontend
yarn lint

# Backend linting
cd backend
flake8 server.py
```

---

## 📝 Recent Updates

### Latest Changes (October 2024)
- ✅ Merged "Shopping Cart" and "My Purchases" into unified "Cart & Purchases" page
- ✅ Removed "Learning Style" from sidebar navigation
- ✅ Removed "Home" link from sidebar (fixed sign-out bug)
- ✅ Enhanced landing page with all sections:
  - Popular Courses showcase
  - Student testimonials
  - Instructor team profiles
  - Complete statistics banner
- ✅ Improved logged-in user experience on landing page
- ✅ Added profile photo upload in onboarding and settings
- ✅ Added student ID field support
- ✅ Fixed ReactPlayer TypeScript compilation

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📧 Contact & Support

For questions or support:
- GitHub Issues: [Create an issue](https://github.com/harsha-203/adatp-v2/issues)
- Email: support@edubox.com

---

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Shadcn for the beautiful UI components
- Supabase for the backend infrastructure
- Emergent for LLM integration

---

**Built with ❤️ using Next.js, FastAPI, and Supabase**
