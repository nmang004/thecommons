# The Commons - Production Deployment Guide

## Overview

This guide covers the complete deployment process for The Commons academic publishing platform. The platform uses a modern, scalable architecture designed for academic institutions worldwide.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │    │   Supabase      │
│   (Frontend)    │◄──►│   (Redis)       │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ • Next.js App   │    │ • Session Cache │    │ • PostgreSQL    │
│ • Edge Functions│    │ • API Cache     │    │ • Auth          │
│ • CDN           │    │ • Performance   │    │ • Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### Required Accounts
- [Vercel](https://vercel.com) - Frontend hosting
- [Railway](https://railway.app) - Redis hosting
- [Supabase](https://supabase.com) - Database and authentication
- [Stripe](https://stripe.com) - Payment processing
- [Resend](https://resend.com) - Email delivery

### Required Tools
```bash
# Install required CLI tools
npm install -g vercel
npm install -g supabase
npm install -g @railway/cli

# Verify installations
vercel --version
supabase --version
railway --version
```

## Step 1: Supabase Production Setup

### 1.1 Create Production Project
1. Log into [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and fill details:
   - **Name**: `thecommons-production`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users (e.g., US East for North America)
4. Wait for project creation (2-3 minutes)

### 1.2 Configure Database
```bash
# Clone your repository
git clone <your-repo-url>
cd thecommons

# Link to production project
supabase link --project-ref <your-project-ref>

# Run all migrations
supabase db push

# Verify deployment
supabase db lint
```

### 1.3 Configure Authentication
1. Go to **Authentication > Settings**
2. Set **Site URL**: `https://thecommons.org`
3. Add **Redirect URLs**:
   - `https://thecommons.org/auth/callback`
   - `https://thecommons.org/dashboard`
4. Configure **Email Templates** for academic context
5. Enable **Email Confirmations**

### 1.4 Configure Storage
1. Go to **Storage**
2. Verify buckets exist:
   - `manuscripts` (private)
   - `published-articles` (public)
   - `profile-avatars` (public)
   - `journal-assets` (public)
3. Configure **Storage Settings**:
   - Max file size: 50MB
   - Allowed MIME types: PDF, DOC, DOCX, TEX, ZIP

### 1.5 Set Up Row Level Security
All RLS policies are automatically applied through migrations. Verify with:
```sql
-- Check that RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
-- Should return empty result
```

## Step 2: Railway Redis Setup

### 2.1 Create Redis Service
```bash
# Login to Railway
railway login

# Create new project
railway projects create thecommons-redis

# Deploy Redis
railway up --service redis
```

### 2.2 Configure Redis
1. In Railway dashboard, go to your Redis service
2. Set **Environment Variables**:
   ```
   REDIS_PASSWORD=<generate-strong-password>
   REDIS_MAXMEMORY=512mb
   REDIS_MAXMEMORY_POLICY=allkeys-lru
   ```
3. Enable **Redis Persistence**
4. Set up **Health Checks**

### 2.3 Get Connection Details
```bash
# Get Redis URL
railway variables
# Copy REDIS_URL for next steps
```

## Step 3: Environment Configuration

### 3.1 Create Production Environment File
Copy `.env.production.example` to `.env.production` and fill in values:

```bash
cp .env.production.example .env.production
```

### 3.2 Required Environment Variables

#### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Stripe (Production Keys)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

#### Redis
```env
REDIS_URL=redis://default:password@host:port
```

#### Email
```env
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@thecommons.org
```

#### Application
```env
NEXT_PUBLIC_APP_URL=https://thecommons.org
NEXT_PUBLIC_APP_NAME=The Commons
NODE_ENV=production
```

## Step 4: Vercel Deployment

### 4.1 Initial Setup
```bash
# Login to Vercel
vercel login

# Import project
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: thecommons
# - Directory: ./
# - Override settings? Yes
```

### 4.2 Configure Project Settings
1. Go to Vercel Dashboard → Your Project → Settings
2. **Environment Variables**: Add all variables from `.env.production`
3. **Build & Development Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. **Functions**:
   - Max Duration: 300 seconds (for PDF generation)

### 4.3 Domain Configuration
1. Go to **Domains** tab
2. Add custom domain: `thecommons.org`
3. Add subdomain: `www.thecommons.org`
4. Configure DNS with your domain provider:
   ```
   A     @     76.76.19.61
   CNAME www   cname.vercel-dns.com
   ```
5. Enable SSL (automatic with Vercel)

### 4.4 Deploy to Production
```bash
# Deploy to production
vercel --prod

# Or use our deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## Step 5: Post-Deployment Configuration

### 5.1 Stripe Webhook Setup
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Webhooks
2. Add endpoint: `https://thecommons.org/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
4. Copy webhook secret to environment variables

### 5.2 Email Template Configuration
Configure Resend templates for:
- Manuscript submission confirmation
- Review invitations
- Editorial decisions
- Payment receipts

### 5.3 Monitoring Setup
1. **Vercel Analytics**: Automatically enabled
2. **Error Tracking**: Configure Sentry (optional)
3. **Uptime Monitoring**: Set up external monitoring

## Step 6: Launch Strategy

### 6.1 Beta Launch Preparation
```bash
# Create beta user list
supabase sql --db-url <production-url> <<EOF
CREATE TABLE beta_users (
  email TEXT PRIMARY KEY,
  institution TEXT,
  invited_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP
);
EOF
```

### 6.2 Beta Launch Checklist
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Payment processing tested
- [ ] Email notifications working
- [ ] File upload/download tested
- [ ] Search functionality working
- [ ] Mobile responsiveness verified
- [ ] Accessibility compliance checked

### 6.3 Soft Launch (Limited Fields)
1. Configure field restrictions in admin panel
2. Enable submissions for selected academic fields
3. Monitor system performance and user feedback

### 6.4 Full Launch
1. Remove field restrictions
2. Enable all features
3. Launch marketing campaign
4. Monitor system scaling

## Step 7: Monitoring & Maintenance

### 7.1 Health Monitoring
Monitor these endpoints:
- `https://thecommons.org/api/monitoring/health`
- `https://thecommons.org/api/monitoring/performance`

### 7.2 Automated Backups
Vercel cron jobs are configured for:
- Daily backups (2:00 AM UTC)
- Weekly cleanup (4:00 AM UTC Sunday)
- Daily analytics (1:00 AM UTC)

### 7.3 Performance Monitoring
Track these metrics:
- Page load time < 2 seconds
- Database query time < 500ms
- File upload success rate > 99%
- Email delivery rate > 95%

### 7.4 Security Monitoring
- Failed login attempts
- Unusual API activity
- File upload violations
- Payment fraud detection

## Step 8: Scaling Considerations

### 8.1 Database Scaling
- Monitor connection pool usage
- Consider read replicas for heavy read workloads
- Implement database connection pooling

### 8.2 Redis Scaling
- Monitor memory usage
- Implement Redis clustering if needed
- Consider Redis Cloud for high availability

### 8.3 CDN Optimization
- Enable Vercel Edge Cache
- Optimize image delivery
- Implement service workers for offline access

## Step 9: Disaster Recovery

### 9.1 Backup Strategy
- **Database**: Daily automated backups via Supabase
- **Files**: Replicated across multiple regions
- **Code**: Git repository with tags for releases

### 9.2 Recovery Procedures
1. **Database Recovery**:
   ```bash
   # Restore from Supabase backup
   supabase db reset --db-url <backup-url>
   ```

2. **Application Recovery**:
   ```bash
   # Redeploy from git tag
   vercel --prod --env production
   ```

### 9.3 Incident Response
1. **Detection**: Automated alerts via monitoring
2. **Assessment**: Check health endpoints and logs
3. **Response**: Execute recovery procedures
4. **Communication**: Update status page and notify users
5. **Post-mortem**: Document incident and improvements

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
vercel logs <deployment-id>

# Local build test
npm run build
```

#### Database Connection Issues
```bash
# Test connection
supabase db ping

# Check connection pool
psql <database-url> -c "SELECT COUNT(*) FROM pg_stat_activity;"
```

#### Redis Connection Issues
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
```

### Performance Issues
1. **Slow Database Queries**: Check query performance in Supabase dashboard
2. **High Memory Usage**: Monitor Redis memory usage
3. **Slow Page Loads**: Check Vercel analytics and Core Web Vitals

### Security Issues
1. **Suspicious Activity**: Check activity logs
2. **Failed Payments**: Review Stripe dashboard
3. **Unauthorized Access**: Review authentication logs

## Support & Documentation

### Production Support Contacts
- **Technical Issues**: support@thecommons.org
- **Security Issues**: security@thecommons.org
- **Academic Partnerships**: partnerships@thecommons.org

### Additional Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Stripe Documentation](https://stripe.com/docs)

---

## Deployment Checklist

### Pre-Deployment
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Tests passing
- [ ] Build successful

### Deployment
- [ ] Supabase project created and configured
- [ ] Railway Redis deployed
- [ ] Vercel project deployed
- [ ] Domain configured
- [ ] SSL enabled

### Post-Deployment
- [ ] Health checks passing
- [ ] Webhooks configured
- [ ] Monitoring enabled
- [ ] Backup procedures tested
- [ ] Performance verified

### Launch Readiness
- [ ] Beta testing completed
- [ ] Documentation updated
- [ ] Support processes ready
- [ ] Marketing materials prepared
- [ ] Academic partnerships established

---

*The Commons - Revolutionizing Academic Publishing*