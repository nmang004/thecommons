#!/bin/bash

# The Commons - Production Deployment Script
# This script handles the complete deployment process for The Commons academic publishing platform

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
  echo -e "${RED}[ERROR] $1${NC}"
  exit 1
}

warning() {
  echo -e "${YELLOW}[WARNING] $1${NC}"
}

success() {
  echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
  log "Checking deployment dependencies..."
  
  command -v npm >/dev/null 2>&1 || error "npm is required but not installed"
  command -v git >/dev/null 2>&1 || error "git is required but not installed"
  command -v vercel >/dev/null 2>&1 || error "Vercel CLI is required. Install with: npm i -g vercel"
  command -v supabase >/dev/null 2>&1 || error "Supabase CLI is required. Install with: npm i -g supabase"
  
  success "All dependencies are installed"
}

# Validate environment variables
validate_environment() {
  log "Validating production environment variables..."
  
  required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "STRIPE_SECRET_KEY"
    "REDIS_URL"
    "RESEND_API_KEY"
    "NEXT_PUBLIC_APP_URL"
  )
  
  missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      missing_vars+=("$var")
    fi
  done
  
  if [[ ${#missing_vars[@]} -ne 0 ]]; then
    error "Missing required environment variables: ${missing_vars[*]}"
  fi
  
  success "Environment variables validated"
}

# Run pre-deployment checks
pre_deployment_checks() {
  log "Running pre-deployment checks..."
  
  # Check git status
  if [[ -n $(git status --porcelain) ]]; then
    warning "Working directory is not clean. Uncommitted changes may not be deployed."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      error "Deployment cancelled"
    fi
  fi
  
  # Run tests
  log "Running test suite..."
  npm run test || error "Tests failed"
  
  # Type check
  log "Running type check..."
  npm run type-check || error "Type check failed"
  
  # Build check
  log "Running build check..."
  npm run build || error "Build failed"
  
  success "Pre-deployment checks completed"
}

# Deploy database migrations
deploy_database() {
  log "Deploying database migrations to production..."
  
  # Link to production project
  supabase link --project-ref "$SUPABASE_PROJECT_REF" || error "Failed to link Supabase project"
  
  # Run migrations
  supabase db push || error "Database migration failed"
  
  # Verify RLS policies
  log "Verifying Row Level Security policies..."
  supabase db lint || warning "Database linting issues detected"
  
  success "Database deployment completed"
}

# Deploy to Vercel
deploy_frontend() {
  log "Deploying frontend to Vercel..."
  
  # Deploy to production
  vercel --prod --yes || error "Vercel deployment failed"
  
  success "Frontend deployment completed"
}

# Setup monitoring
setup_monitoring() {
  log "Setting up production monitoring..."
  
  # Create monitoring endpoints test
  curl -f "$NEXT_PUBLIC_APP_URL/api/monitoring/health" || warning "Health check endpoint not responding"
  
  success "Monitoring setup completed"
}

# Post-deployment verification
post_deployment_verification() {
  log "Running post-deployment verification..."
  
  # Test key endpoints
  endpoints=(
    "/"
    "/api/monitoring/health"
    "/articles"
    "/about"
  )
  
  for endpoint in "${endpoints[@]}"; do
    log "Testing endpoint: $endpoint"
    if ! curl -f -s "$NEXT_PUBLIC_APP_URL$endpoint" > /dev/null; then
      error "Endpoint $endpoint is not responding"
    fi
  done
  
  # Test database connectivity
  log "Testing database connectivity..."
  if ! curl -f -s "$NEXT_PUBLIC_APP_URL/api/monitoring/health" | grep -q "healthy"; then
    error "Database connectivity check failed"
  fi
  
  success "Post-deployment verification completed"
}

# Send deployment notification
send_notification() {
  log "Sending deployment notification..."
  
  # Get deployment URL from Vercel
  DEPLOYMENT_URL=$(vercel ls --meta | grep "thecommons" | head -n 1 | awk '{print $2}')
  
  # Send email notification (if configured)
  if [[ -n "$ADMIN_EMAIL" ]]; then
    curl -X POST "$NEXT_PUBLIC_APP_URL/api/notifications/deployment" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$ADMIN_EMAIL\",\"url\":\"$DEPLOYMENT_URL\",\"status\":\"success\"}" \
      || warning "Failed to send deployment notification"
  fi
  
  success "Deployment notification sent"
}

# Cleanup function
cleanup() {
  log "Cleaning up temporary files..."
  # Add any cleanup tasks here
  success "Cleanup completed"
}

# Main deployment function
main() {
  log "Starting The Commons production deployment..."
  
  # Trap for cleanup on exit
  trap cleanup EXIT
  
  # Run deployment steps
  check_dependencies
  validate_environment
  pre_deployment_checks
  deploy_database
  deploy_frontend
  setup_monitoring
  post_deployment_verification
  send_notification
  
  success "🎉 The Commons has been successfully deployed to production!"
  log "Application URL: $NEXT_PUBLIC_APP_URL"
  log "Admin Dashboard: $NEXT_PUBLIC_APP_URL/admin"
  log "API Health: $NEXT_PUBLIC_APP_URL/api/monitoring/health"
}

# Parse command line arguments
case "${1:-}" in
  --skip-tests)
    SKIP_TESTS=true
    shift
    ;;
  --force)
    FORCE_DEPLOY=true
    shift
    ;;
  --help|-h)
    echo "The Commons Deployment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --skip-tests    Skip running tests before deployment"
    echo "  --force         Force deployment even with uncommitted changes"
    echo "  --help, -h      Show this help message"
    echo ""
    exit 0
    ;;
esac

# Run main deployment
main "$@"