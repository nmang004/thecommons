# ORCID Integration Guide for The Commons

## Overview

ORCID (Open Researcher and Contributor ID) provides a persistent digital identifier for researchers. This guide covers the complete integration of ORCID authentication, profile verification, and data synchronization with The Commons platform.

## Table of Contents

1. [ORCID API Registration](#orcid-api-registration)
2. [Environment Setup](#environment-setup)
3. [Database Schema](#database-schema)
4. [OAuth 2.0 Implementation](#oauth-20-implementation)
5. [API Integration](#api-integration)
6. [User Interface Components](#user-interface-components)
7. [Testing with Sample Data](#testing-with-sample-data)
8. [Deployment Considerations](#deployment-considerations)
9. [Troubleshooting](#troubleshooting)

## ORCID API Registration

### Sandbox Environment (Development)

1. Visit [ORCID Sandbox](https://sandbox.orcid.org/)
2. Create a test account if needed
3. Register your application at the [ORCID Developer Tools](https://sandbox.orcid.org/developer-tools)
4. Provide the following details:
   - **Application Name**: "The Commons - Academic Publishing Platform"
   - **Website URL**: `https://localhost:3000` (development)
   - **Description**: "Open access academic publishing platform with peer review"
   - **Redirect URIs**: 
     - `http://localhost:3000/api/orcid/callback`
     - `https://your-domain.com/api/orcid/callback` (production)

### Production Environment

1. Visit [ORCID.org](https://orcid.org/)
2. Apply for Member API credentials (required for writing data)
3. Complete the membership application process
4. Register your production application

### Required Information

After registration, you'll receive:
- **Client ID**: `APP-XXXXXXXXXXXXXXXXX`
- **Client Secret**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Environment URLs**:
  - Sandbox: `https://sandbox.orcid.org`
  - Production: `https://orcid.org`

## Environment Setup

### Environment Variables

Add to your `.env.local`:

```bash
# ORCID Integration
ORCID_CLIENT_ID=APP-XXXXXXXXXXXXXXXXX
ORCID_CLIENT_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ORCID_REDIRECT_URI=http://localhost:3000/api/orcid/callback
ORCID_ENVIRONMENT=sandbox

# ORCID API Endpoints (Sandbox)
NEXT_PUBLIC_ORCID_AUTH_URL=https://sandbox.orcid.org/oauth/authorize
ORCID_TOKEN_URL=https://sandbox.orcid.org/oauth/token
ORCID_API_URL=https://api.sandbox.orcid.org/v3.0

# Production URLs (use when ready)
# NEXT_PUBLIC_ORCID_AUTH_URL=https://orcid.org/oauth/authorize
# ORCID_TOKEN_URL=https://orcid.org/oauth/token
# ORCID_API_URL=https://api.orcid.org/v3.0
```

### Required Dependencies

```bash
npm install node-fetch jose
npm install --save-dev @types/node-fetch
```

## Database Schema

### Migration: Add ORCID Fields

Create migration file: `/supabase/migrations/XXX_add_orcid_integration.sql`

```sql
-- Add ORCID-related columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_auth_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_scope TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_connected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_last_sync TIMESTAMP WITH TIME ZONE;

-- Create ORCID sync history table
CREATE TABLE IF NOT EXISTS orcid_sync_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sync_type TEXT NOT NULL,
  items_synced INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_orcid ON profiles(orcid) WHERE orcid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_orcid_verified ON profiles(orcid_verified) WHERE orcid_verified = true;
CREATE INDEX IF NOT EXISTS idx_orcid_sync_history_user_id ON orcid_sync_history(user_id);

-- Add RLS policies
ALTER TABLE orcid_sync_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ORCID sync history" 
  ON orcid_sync_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert ORCID sync records" 
  ON orcid_sync_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

## OAuth 2.0 Implementation

### OAuth Flow Overview

1. **Authorization Request**: User clicks "Connect ORCID" → Redirect to ORCID
2. **User Authorization**: User grants permissions on ORCID.org
3. **Authorization Code**: ORCID redirects back with code
4. **Token Exchange**: Exchange code for access token
5. **Profile Data**: Fetch authenticated ORCID iD and profile data

### Scopes

- `/authenticate`: Get authenticated ORCID iD and read public data
- `/read-limited`: Read data marked as "trusted parties only"
- `/person/update`: Update biographical information (Member API only)
- `/activities/update`: Add works, employment, etc. (Member API only)

### Implementation Files

The OAuth implementation consists of several key files:
- `/lib/orcid/client.ts` - Main ORCID API client
- `/lib/orcid/oauth.ts` - OAuth flow handlers
- `/lib/orcid/types.ts` - TypeScript interfaces
- `/app/api/orcid/auth/route.ts` - Initialize OAuth
- `/app/api/orcid/callback/route.ts` - Handle callback

## API Integration

### ORCID API Endpoints

#### Get Authenticated ORCID iD
```
GET https://api.sandbox.orcid.org/v3.0/{orcid-id}
Authorization: Bearer {access-token}
Accept: application/json
```

#### Get Person Details
```
GET https://api.sandbox.orcid.org/v3.0/{orcid-id}/person
Authorization: Bearer {access-token}
Accept: application/json
```

#### Get Works (Publications)
```
GET https://api.sandbox.orcid.org/v3.0/{orcid-id}/works
Authorization: Bearer {access-token}
Accept: application/json
```

### Rate Limits

- **Public API**: 24 requests per second
- **Member API**: 40 requests per second
- Implement exponential backoff for rate limit handling

## User Interface Components

### ORCID Connection Button

Displays the official ORCID button styling:
- Green background (#A6CE39)
- ORCID logo with iD icon
- "Connect your ORCID iD" text
- Loading states
- Error handling

### ORCID Profile Badge

Shows verification status:
- Green checkmark for verified ORCID
- ORCID iD display (0000-0000-0000-0000 format)
- Link to ORCID profile
- Sync status indicators

### Profile Import Dialog

Allows users to:
- Review ORCID profile data
- Select which fields to import
- Handle conflicts with existing data
- Preview changes before applying

## Testing with Sample Data

### Sandbox Test ORCID iDs

Use these ORCID iDs for development testing:

```javascript
export const SANDBOX_TEST_ORCIDS = {
  // Full profile with multiple works
  'FULL_PROFILE': '0000-0002-1825-0097',
  
  // Basic profile, minimal data
  'BASIC_PROFILE': '0000-0001-5109-3700',
  
  // Profile with affiliations and education
  'WITH_AFFILIATIONS': '0000-0003-1415-9269',
  
  // Profile for testing edge cases
  'EDGE_CASES': '0000-0002-7183-4567'
};
```

### Mock Data for Development

Create realistic test data that mirrors ORCID API responses:
- Profile information
- Publication lists
- Employment history
- Education records

### Testing Scenarios

1. **First-time Connection**: New user connects ORCID
2. **Profile Update**: Existing user links ORCID to account
3. **Data Import**: Import publications and affiliations
4. **Token Refresh**: Handle expired access tokens
5. **Error Handling**: Network errors, API failures
6. **Disconnection**: Remove ORCID connection

## Deployment Considerations

### Production Environment

1. **API Credentials**: Use production ORCID credentials
2. **HTTPS Required**: All redirect URIs must use HTTPS
3. **Token Security**: Encrypt stored access/refresh tokens
4. **Rate Limiting**: Implement proper rate limiting
5. **Monitoring**: Track API usage and errors

### Security Best Practices

1. **Token Encryption**: Encrypt tokens at rest
2. **Scope Minimization**: Request only necessary scopes
3. **Regular Token Refresh**: Implement refresh token logic
4. **Audit Logging**: Log all ORCID operations
5. **User Consent**: Clear permission explanations

## Integration with The Commons Features

### Author Submission

1. **ORCID Verification**: Verify primary author ORCID during submission
2. **Co-author Validation**: Validate co-author ORCID iDs
3. **Auto-fill**: Populate author information from ORCID
4. **Publication Updates**: Add published articles to ORCID (Member API)

### Profile Management

1. **Identity Verification**: Display verification badges
2. **Data Synchronization**: Sync profile updates with ORCID
3. **Publication Import**: Import existing publications
4. **Conflict Resolution**: Handle data conflicts gracefully

### Peer Review

1. **Reviewer Identity**: Verify reviewer ORCID iDs
2. **Activity Tracking**: Log peer review activities (Member API)
3. **Recognition**: Update ORCID with review contributions

## Troubleshooting

### Common Issues

#### OAuth Flow Problems
- **Invalid redirect URI**: Ensure URI exactly matches registered value
- **Missing state parameter**: Include anti-CSRF state parameter
- **Token exchange failure**: Check client credentials and endpoint URLs

#### API Integration Issues
- **Rate limiting**: Implement backoff and retry logic
- **Token expiration**: Use refresh tokens to get new access tokens
- **Scope permissions**: Ensure requested scopes match API operations

#### Data Synchronization
- **Profile conflicts**: Implement merge logic for conflicting data
- **Missing permissions**: Check token scopes for required operations
- **API version compatibility**: Use ORCID API v3.0 for consistency

### Debug Mode

Enable debug logging by setting:
```bash
ORCID_DEBUG=true
```

This will log:
- OAuth flow steps
- API requests/responses
- Token refresh attempts
- Error details

### Support Resources

- [ORCID Support](https://support.orcid.org/)
- [ORCID API Documentation](https://info.orcid.org/documentation/)
- [ORCID GitHub](https://github.com/ORCID)
- [Integration FAQ](https://info.orcid.org/documentation/integration-and-api-faq/)

## Implementation Checklist

### Development Phase
- [ ] Register sandbox API credentials
- [ ] Set up environment variables
- [ ] Create database migrations
- [ ] Implement OAuth flow
- [ ] Build API client
- [ ] Create UI components
- [ ] Add sample data
- [ ] Write unit tests
- [ ] Test integration end-to-end

### Production Phase
- [ ] Register production API credentials
- [ ] Update environment variables
- [ ] Deploy database migrations
- [ ] Configure HTTPS endpoints
- [ ] Enable encryption for tokens
- [ ] Set up monitoring
- [ ] Test with real ORCID accounts
- [ ] Update documentation
- [ ] Train support team

## Maintenance

### Regular Tasks
- Monitor API usage and quotas
- Update tokens before expiration
- Sync profile changes
- Handle API version updates
- Review security practices

### Quarterly Reviews
- Analyze integration performance
- Update test data
- Review user feedback
- Check for new ORCID features
- Update documentation

This guide provides a comprehensive foundation for implementing ORCID integration in The Commons platform. Follow the checklist systematically and refer to the troubleshooting section for common issues.