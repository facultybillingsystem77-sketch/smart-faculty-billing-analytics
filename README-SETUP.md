# Smart Faculty Billing & Analytics System - Setup Guide

## 🎯 Overview
A full-stack web application for managing faculty billing, workload tracking, and analytics with AI-ready architecture.

## 📋 Tech Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Database**: Turso (SQLite)
- **ORM**: Drizzle ORM
- **Charts**: Chart.js + react-chartjs-2
- **PDF Generation**: jsPDF + jspdf-autotable
- **Authentication**: JWT + bcrypt
- **UI Components**: Shadcn/UI + Radix UI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or bun package manager

### Installation Steps

1. **Install Dependencies**
```bash
npm install
# or
bun install
```

2. **Environment Variables**
The `.env` file is already configured with:
```
TURSO_DATABASE_URL=<your_database_url>
TURSO_AUTH_TOKEN=<your_auth_token>
JWT_SECRET=your-secret-key-change-in-production
```

3. **Database Setup**
The database is already configured and seeded with sample data:
- 1 Admin user
- 15 Faculty members
- 90 Billing records (6 months of data)

4. **Run Development Server**
```bash
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:3000`

## 🔐 Demo Credentials

### Admin Access
- **Email**: `admin@faculty.edu`
- **Password**: `admin123`
- **Features**: Full access to all modules

### Faculty Access
- **Email**: `john.smith@faculty.edu`
- **Password**: `faculty123`
- **Features**: View profile, workload, and salary slips

## 📁 Project Structure

```
smart-faculty-billing/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── admin/                # Admin portal pages
│   │   │   ├── dashboard/        # Admin dashboard
│   │   │   ├── faculty/          # Faculty management
│   │   │   ├── billing/          # Billing management
│   │   │   └── analytics/        # Analytics dashboard
│   │   ├── faculty/              # Faculty portal
│   │   │   └── dashboard/        # Faculty dashboard
│   │   ├── login/                # Login page
│   │   ├── api/                  # API routes
│   │   │   ├── auth/             # Authentication APIs
│   │   │   ├── faculty/          # Faculty CRUD APIs
│   │   │   ├── billing/          # Billing APIs
│   │   │   └── analytics/        # Analytics APIs
│   │   └── page.tsx              # Homepage
│   ├── components/               # React components
│   │   └── ui/                   # Shadcn UI components
│   ├── db/                       # Database
│   │   ├── schema.ts             # Database schema
│   │   ├── index.ts              # Database connection
│   │   └── seeds/                # Seed data
│   ├── hooks/                    # Custom React hooks
│   └── lib/                      # Utility functions
├── public/                       # Static assets
├── .env                          # Environment variables
├── package.json                  # Dependencies
└── README.md                     # Main documentation
```

## 🎨 Features

### Admin Portal (`/admin`)
1. **Dashboard** (`/admin/dashboard`)
   - Total faculty count
   - Total billing records
   - Pending payments
   - Average salary statistics
   - Quick action cards

2. **Faculty Management** (`/admin/faculty`)
   - Add/Edit/Delete faculty
   - Search and filter
   - Department and designation filters
   - Comprehensive faculty profiles

3. **Billing Management** (`/admin/billing`)
   - Create salary records
   - Status management (pending/processed/paid)
   - PDF salary slip generation
   - Search and filter by status

4. **Analytics Dashboard** (`/admin/analytics`)
   - Salary trends over time (Line chart)
   - Department-wise salary comparison (Bar chart)
   - Workload distribution (Pie chart)
   - Interactive Chart.js visualizations

### Faculty Portal (`/faculty`)
1. **Dashboard** (`/faculty/dashboard`)
   - Personal profile information
   - Current workload display
   - Recent salary history
   - Download salary slips as PDF

### Authentication
- Secure login with JWT
- Password reset functionality
- Role-based access control (Admin/Faculty)
- Protected routes

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/reset-password` - Password reset

### Faculty Management
- `GET /api/faculty` - List all faculty
- `GET /api/faculty/[id]` - Get faculty details
- `POST /api/faculty` - Create faculty
- `PUT /api/faculty/[id]` - Update faculty
- `DELETE /api/faculty/[id]` - Delete faculty

### Billing Management
- `GET /api/billing` - List all billing records
- `GET /api/billing/[id]` - Get billing details
- `GET /api/billing/faculty/[facultyId]` - Get faculty billing history
- `POST /api/billing` - Create billing record
- `PUT /api/billing/[id]` - Update billing record

### Analytics
- `GET /api/analytics/salary-trends` - Salary trends data
- `GET /api/analytics/department-comparison` - Department comparison
- `GET /api/analytics/workload` - Workload distribution

## 🎯 Key Features

### PDF Salary Slips
- Professional salary slip generation
- Detailed pay breakdown
- Workload information
- Institution branding
- Downloadable format

### Real-time Analytics
- Interactive Chart.js visualizations
- Department-wise comparisons
- Salary trend analysis
- Workload distribution metrics

### Responsive Design
- Mobile-friendly interface
- Modern Tailwind CSS styling
- Smooth animations
- Professional blue-gray theme

## 🔧 Development

### Build for Production
```bash
npm run build
# or
bun run build
```

### Run Production Server
```bash
npm start
# or
bun start
```

### Lint Code
```bash
npm run lint
```

## 🗄️ Database Schema

### User Table
- Authentication and user information
- Roles: admin, faculty

### Faculty Table
- Employment details
- Department and designation
- Base salary information
- Contact information

### Billing Table
- Monthly salary records
- Allowances and deductions
- Workload tracking (lectures, labs, tutorials)
- Payment status

## 🌟 Future Enhancements (Prepared)

### AI Integration
- Placeholder route: `/api/ai/assistant`
- Ready for AI-powered insights
- Automated billing suggestions
- Predictive analytics

## 📝 Environment Variables

Required environment variables in `.env`:

```env
# Database (Turso)
TURSO_DATABASE_URL=your_database_url
TURSO_AUTH_TOKEN=your_auth_token

# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production

# Email (Optional - for password reset)
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
```

## 🐛 Troubleshooting

### Common Issues

1. **Module not found errors**
   - Run `npm install` or `bun install`
   - Restart the dev server

2. **Database connection errors**
   - Check `.env` file configuration
   - Verify Turso credentials

3. **Build errors**
   - Clear `.next` folder
   - Run `npm run build` again

## 📄 License

This project is for educational and demonstration purposes.

## 👥 Support

For issues and questions, please refer to the documentation or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Built with**: Next.js 15 + TypeScript + Tailwind CSS
