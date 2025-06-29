# The Commons - Academic Publishing Platform

## Overview

The Commons is a revolutionary academic publishing platform that disrupts traditional publishing with open access, fair pricing, and transparent peer review. Built with modern web technologies, it provides a comprehensive solution for authors, editors, reviewers, and readers in the academic community.

## 🎯 Key Features

### For Authors
- **Manuscript Submission Wizard**: Intuitive multi-step submission process with file uploads
- **Real-time Collaboration**: Track manuscript status and communicate with editors
- **Author Analytics**: Comprehensive insights into article performance and citations
- **Revision Management**: Streamlined revision submission and tracking

### For Editors
- **Editorial Dashboard**: Complete manuscript lifecycle management
- **Reviewer Assignment**: Smart reviewer matching and invitation system
- **Decision Workflow**: Structured decision-making process with templates
- **Performance Metrics**: Editorial statistics and processing time analytics

### For Reviewers
- **Review Dashboard**: Organized review assignments and deadlines
- **Structured Review Forms**: Guided review process with customizable criteria
- **Recognition System**: Public acknowledgment and contribution tracking
- **Conflict Management**: Automated conflict of interest detection

### For Readers
- **Open Access**: Free access to all published articles
- **Advanced Search**: Full-text search with filters by field, author, and date
- **Citation Tools**: One-click citation export in multiple formats
- **Article Metrics**: View counts, downloads, and citation tracking

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + custom academic design system
- **UI Components**: Shadcn/UI + custom academic components
- **State Management**: React hooks + Context API
- **Forms**: React Hook Form + Zod validation

### Backend & Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email verification
- **File Storage**: Supabase Storage for manuscripts and supplementary files
- **Payments**: Stripe integration for publication fees
- **Email**: Resend for transactional emails
- **Cache**: Redis for performance optimization
- **Monitoring**: Custom error tracking and analytics

### Development & Testing
- **Testing**: Jest (unit), Playwright (E2E), React Testing Library
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **CI/CD**: GitHub Actions for automated testing
- **Performance**: Lighthouse CI for performance monitoring

## 📁 Project Structure

```
thecommons/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Role-based dashboards
│   ├── (public)/          # Public pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Core UI components
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   └── dashboard/        # Dashboard components
├── lib/                   # Utilities and services
│   ├── supabase/         # Database clients
│   ├── stripe/           # Payment integration
│   ├── email/            # Email templates
│   ├── analytics/        # Analytics services
│   └── security/         # Security utilities
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── styles/               # Global styles
├── public/               # Static assets
├── supabase/             # Database migrations
├── __tests__/            # Test files
└── e2e/                  # E2E test scenarios
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- Stripe account (for payments)
- Redis instance (for caching)

### Environment Variables
Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Redis
REDIS_URL=your_redis_url

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Clone the repository
git clone https://github.com/nmang004/thecommons.git
cd thecommons

# Install dependencies
npm install

# Run database migrations
npx supabase db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:a11y    # Run accessibility tests

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run typecheck    # Run TypeScript checks

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
```

## 📊 Features Implementation Status

### ✅ Phase 1-8 Completed
- [x] Project setup and configuration
- [x] Database schema and migrations
- [x] Authentication system with email verification
- [x] Role-based access control (Author, Editor, Reviewer, Admin)
- [x] Public pages (Home, About, Articles, Search)
- [x] Manuscript submission workflow
- [x] Editorial dashboard and review management
- [x] Payment integration with Stripe
- [x] Email notifications
- [x] Analytics and monitoring
- [x] Performance optimization
- [x] Accessibility compliance (WCAG 2.1 AA)
- [x] Testing infrastructure

### 🚧 Upcoming Features
- [ ] Mobile application
- [ ] API for third-party integrations
- [ ] Advanced citation network visualization
- [ ] AI-powered reviewer matching
- [ ] Blockchain-based publication certificates
- [ ] Multi-language support

## 🎨 Design System

The platform uses a custom academic design system featuring:

- **Colors**: Deep Academic Blue (#1e3a8a), Scholarly Gold (#d97706)
- **Typography**: Playfair Display (headings), Inter (UI), Crimson Text (articles)
- **Components**: Academic-themed cards, buttons, and layouts
- **Responsive**: Mobile-first design with breakpoints at 640px, 768px, 1024px, 1280px
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Print**: Optimized print stylesheets for articles

## 🔒 Security

- **Authentication**: Secure JWT-based auth with refresh tokens
- **Authorization**: Row-level security in Supabase
- **API Security**: Rate limiting, CORS protection, input validation
- **Data Protection**: Encrypted at rest and in transit
- **Content Security**: CSP headers, XSS protection
- **Payment Security**: PCI-compliant Stripe integration

## 📈 Performance

- **Core Web Vitals**: Optimized for LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Caching**: Redis caching for frequently accessed data
- **Code Splitting**: Dynamic imports for route-based splitting
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Size**: Tree shaking and minification
- **CDN**: Static assets served from Vercel Edge Network

## 🧪 Testing

- **Unit Tests**: Component and utility function testing with Jest
- **Integration Tests**: API route testing with supertest
- **E2E Tests**: User journey testing with Playwright
- **Accessibility Tests**: Automated WCAG compliance testing
- **Performance Tests**: Lighthouse CI in CI/CD pipeline
- **Visual Regression**: Screenshot comparison for UI consistency

## 📚 Documentation

- `PLAN.md`: Complete project roadmap and phase details
- `DESIGN_SYSTEM.md`: Comprehensive design guidelines
- `CLAUDE.md`: Development reference and standards
- `TESTING.md`: Testing strategies and guidelines

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
- Database powered by [Supabase](https://supabase.com/)
- Payments by [Stripe](https://stripe.com/)
- Deployed on [Vercel](https://vercel.com/)

## 📞 Support

For support, email support@thecommons.org or join our Slack community.

---

**The Commons** - Democratizing Academic Publishing 📚✨
