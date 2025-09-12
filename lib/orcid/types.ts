/**
 * TypeScript definitions for ORCID API integration
 * Based on ORCID API v3.0 specification
 */

// Core ORCID identifier type
export interface OrcidIdentifier {
  uri: string;
  path: string;
  host: string;
}

// OAuth token response from ORCID
export interface OrcidTokenResponse {
  access_token: string;
  token_type: 'bearer';
  refresh_token: string;
  expires_in: number;
  scope: string;
  name?: string;
  orcid: string;
}

// ORCID person name structure
export interface OrcidName {
  'given-names'?: {
    value: string;
  };
  'family-name'?: {
    value: string;
  };
  'credit-name'?: {
    value: string;
  };
}

// ORCID biography
export interface OrcidBiography {
  value: string;
}

// ORCID email structure
export interface OrcidEmail {
  email: string;
  verified: boolean;
  primary: boolean;
  visibility?: 'PUBLIC' | 'LIMITED' | 'PRIVATE';
}

// ORCID researcher URL
export interface OrcidResearcherUrl {
  'url-name': string;
  url: {
    value: string;
  };
  'created-date'?: {
    value: number;
  };
  'last-modified-date'?: {
    value: number;
  };
}

// ORCID address
export interface OrcidAddress {
  city?: string;
  region?: string;
  country: string;
}

// ORCID organization
export interface OrcidOrganization {
  name: string;
  address: OrcidAddress;
  'disambiguated-organization'?: {
    'disambiguated-organization-identifier': string;
    'disambiguation-source': string;
  };
}

// ORCID date structure
export interface OrcidDate {
  year?: {
    value: string;
  };
  month?: {
    value: string;
  };
  day?: {
    value: string;
  };
}

// ORCID employment/affiliation
export interface OrcidEmployment {
  'put-code'?: number;
  organization: OrcidOrganization;
  'role-title'?: string;
  'department-name'?: string;
  'start-date'?: OrcidDate;
  'end-date'?: OrcidDate | null;
  'created-date'?: {
    value: number;
  };
  'last-modified-date'?: {
    value: number;
  };
  source?: {
    'source-client-id': {
      uri: string;
      path: string;
      host: string;
    };
    'source-name': {
      value: string;
    };
  };
}

// ORCID education
export interface OrcidEducation {
  'put-code'?: number;
  organization: OrcidOrganization;
  'role-title'?: string;
  'department-name'?: string;
  'start-date'?: OrcidDate;
  'end-date'?: OrcidDate | null;
}

// ORCID external identifier
export interface OrcidExternalId {
  'external-id-type': string;
  'external-id-value': string;
  'external-id-url'?: {
    value: string;
  };
  'external-id-relationship'?: 'SELF' | 'PART_OF' | 'FUNDED_BY' | 'SUPPORTED_BY';
}

// ORCID work/publication title
export interface OrcidWorkTitle {
  title: {
    value: string;
  };
  subtitle?: {
    value: string;
  };
  'translated-title'?: {
    value: string;
    'language-code': string;
  };
}

// ORCID work citation
export interface OrcidWorkCitation {
  'citation-type': 'FORMATTED_UNSPECIFIED' | 'BIBTEX' | 'RIS' | 'FORMATTED_APA' | 'FORMATTED_HARVARD' | 'FORMATTED_IEEE' | 'FORMATTED_MLA' | 'FORMATTED_VANCOUVER' | 'FORMATTED_CHICAGO';
  'citation-value': string;
}

// ORCID work/publication
export interface OrcidWork {
  'put-code'?: number;
  title: OrcidWorkTitle;
  'journal-title'?: {
    value: string;
  };
  'short-description'?: string;
  citation?: OrcidWorkCitation;
  type: 'JOURNAL_ARTICLE' | 'BOOK_CHAPTER' | 'BOOK' | 'CONFERENCE_PAPER' | 'WORKING_PAPER' | 'REPORT' | 'DATA_SET' | 'TEST' | 'OTHER';
  'publication-date'?: OrcidDate;
  'external-ids'?: {
    'external-id': OrcidExternalId[];
  };
  url?: {
    value: string;
  };
  contributors?: {
    contributor: Array<{
      'contributor-orcid'?: OrcidIdentifier;
      'credit-name'?: {
        value: string;
      };
      'contributor-email'?: {
        value: string;
      };
      'contributor-attributes'?: {
        'contributor-sequence'?: 'FIRST' | 'ADDITIONAL';
        'contributor-role'?: string;
      };
    }>;
  };
  'created-date'?: {
    value: number;
  };
  'last-modified-date'?: {
    value: number;
  };
  source?: {
    'source-client-id': {
      uri: string;
      path: string;
      host: string;
    };
    'source-name': {
      value: string;
    };
  };
}

// ORCID work summary (used in works list)
export interface OrcidWorkSummary {
  'put-code': number;
  title: OrcidWorkTitle;
  'journal-title'?: {
    value: string;
  };
  'publication-date'?: OrcidDate;
  type: string;
  'external-ids'?: {
    'external-id': OrcidExternalId[];
  };
  'created-date': {
    value: number;
  };
  'last-modified-date': {
    value: number;
  };
}

// ORCID works response (list of work groups)
export interface OrcidWorksResponse {
  'last-modified-date'?: {
    value: number;
  };
  group: Array<{
    'last-modified-date': {
      value: number;
    };
    'work-summary': OrcidWorkSummary[];
  }>;
}

// ORCID person response (complete profile)
export interface OrcidPersonResponse {
  'orcid-identifier': OrcidIdentifier;
  person: {
    'last-modified-date'?: {
      value: number;
    };
    name?: OrcidName;
    biography?: OrcidBiography;
    'researcher-urls'?: {
      'last-modified-date'?: {
        value: number;
      };
      'researcher-url': OrcidResearcherUrl[];
    };
    emails?: {
      'last-modified-date'?: {
        value: number;
      };
      email: OrcidEmail[];
    };
    addresses?: {
      'last-modified-date'?: {
        value: number;
      };
      address: Array<{
        'put-code': number;
        country: {
          value: string;
        };
        'created-date': {
          value: number;
        };
        'last-modified-date': {
          value: number;
        };
      }>;
    };
    keywords?: {
      'last-modified-date'?: {
        value: number;
      };
      keyword: Array<{
        'put-code': number;
        content: string;
        'created-date': {
          value: number;
        };
        'last-modified-date': {
          value: number;
        };
      }>;
    };
  };
}

// ORCID activities response
export interface OrcidActivitiesResponse {
  'orcid-identifier': OrcidIdentifier;
  'activities-summary': {
    'last-modified-date'?: {
      value: number;
    };
    employments?: {
      'last-modified-date'?: {
        value: number;
      };
      'employment-summary': OrcidEmployment[];
    };
    educations?: {
      'last-modified-date'?: {
        value: number;
      };
      'education-summary': OrcidEducation[];
    };
    works?: OrcidWorksResponse;
  };
}

// ORCID record response (complete record)
export interface OrcidRecordResponse {
  'orcid-identifier': OrcidIdentifier;
  person: OrcidPersonResponse['person'];
  'activities-summary': OrcidActivitiesResponse['activities-summary'];
}

// Configuration for ORCID client
export interface OrcidConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  redirectUri: string;
  scope: string;
  apiVersion: string;
}

// Environment-specific URLs
export interface OrcidEnvironmentUrls {
  authUrl: string;
  tokenUrl: string;
  apiUrl: string;
}

// ORCID API client configuration
export interface OrcidClientConfig extends OrcidConfig {
  urls: OrcidEnvironmentUrls;
}

// ORCID API error response
export interface OrcidApiError {
  error: string;
  'error-desc'?: string;
  'developer-message'?: string;
  'user-message'?: string;
  'error-code'?: number;
  'more-info'?: string;
}

// Local profile data for ORCID sync
export interface LocalProfileData {
  id: string;
  fullName: string;
  email: string;
  affiliation?: string;
  orcid?: string;
  orcidVerified: boolean;
  bio?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  hIndex?: number;
  totalPublications?: number;
}

// ORCID sync options
export interface OrcidSyncOptions {
  syncProfile?: boolean;
  syncWorks?: boolean;
  syncEmployments?: boolean;
  syncEducations?: boolean;
  overwriteLocal?: boolean;
  dryRun?: boolean;
}

// ORCID sync result
export interface OrcidSyncResult {
  success: boolean;
  syncType: 'profile' | 'publications' | 'affiliations' | 'education' | 'works';
  itemsSynced: number;
  errors?: string[];
  warnings?: string[];
  data?: any;
}

// Comprehensive sync result
export interface OrcidComprehensiveSyncResult {
  success: boolean;
  results: OrcidSyncResult[];
  totalItemsSynced: number;
  errors: string[];
  warnings: string[];
  duration: number; // milliseconds
}

// ORCID authentication state
export interface OrcidAuthState {
  orcidId?: string;
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  expiresAt?: Date;
  isAuthenticated: boolean;
  isExpired: boolean;
}

// ORCID connection status
export interface OrcidConnectionStatus {
  isConnected: boolean;
  orcidId?: string;
  connectedAt?: Date;
  lastSyncAt?: Date;
  scope?: string;
  hasValidToken: boolean;
  needsReauth: boolean;
}

// Publication import data
export interface OrcidPublicationImport {
  putCode: string;
  title: string;
  journal?: string;
  doi?: string;
  publicationDate?: {
    year?: string;
    month?: string;
    day?: string;
  };
  type: string;
  url?: string;
  citation?: string;
  isSelected?: boolean;
  existsLocally?: boolean;
  conflictsWithLocal?: boolean;
}

// Publication import result
export interface OrcidPublicationImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: number;
  publications: Array<{
    putCode: string;
    title: string;
    status: 'imported' | 'skipped' | 'error';
    error?: string;
    manuscriptId?: string;
  }>;
}

// OAuth state parameter for CSRF protection
export interface OrcidOAuthState {
  state: string;
  redirectTo?: string;
  userId?: string;
  timestamp: number;
}

// Rate limiting information
export interface OrcidRateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// API response wrapper
export interface OrcidApiResponse<T> {
  data?: T;
  error?: OrcidApiError;
  rateLimitInfo?: OrcidRateLimitInfo;
  statusCode: number;
  success: boolean;
}

// Webhook notification types (if using webhooks)
export interface OrcidWebhookNotification {
  'orcid-id': string;
  'activity-type': 'WORK' | 'EMPLOYMENT' | 'EDUCATION' | 'FUNDING' | 'PEER_REVIEW';
  'activity-action': 'CREATE' | 'UPDATE' | 'DELETE';
  'put-code'?: number;
  'notification-type': 'ORCID_API';
  'created-date': string;
}

// Type guards
export function isOrcidApiError(obj: any): obj is OrcidApiError {
  return obj && typeof obj.error === 'string';
}

export function isOrcidTokenResponse(obj: any): obj is OrcidTokenResponse {
  return obj && 
    typeof obj.access_token === 'string' &&
    typeof obj.token_type === 'string' &&
    typeof obj.orcid === 'string';
}

export function isValidOrcidId(orcidId: string): boolean {
  const orcidRegex = /^0000-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$/;
  return orcidRegex.test(orcidId);
}

export function isOrcidPersonResponse(obj: any): obj is OrcidPersonResponse {
  return obj && 
    obj['orcid-identifier'] &&
    obj.person &&
    typeof obj['orcid-identifier'].path === 'string';
}

export function isOrcidWorksResponse(obj: any): obj is OrcidWorksResponse {
  return obj && 
    Array.isArray(obj.group) &&
    obj.group.every((group: any) => 
      Array.isArray(group['work-summary'])
    );
}

// Utility types
export type OrcidScope = '/authenticate' | '/read-limited' | '/person/update' | '/activities/update' | '/read-public';

export type OrcidEnvironment = 'sandbox' | 'production';

export type OrcidWorkType = 'JOURNAL_ARTICLE' | 'BOOK_CHAPTER' | 'BOOK' | 'CONFERENCE_PAPER' | 'WORKING_PAPER' | 'REPORT' | 'DATA_SET' | 'TEST' | 'OTHER';

export type OrcidVisibility = 'PUBLIC' | 'LIMITED' | 'PRIVATE';

// Constants
export const ORCID_SCOPES = {
  AUTHENTICATE: '/authenticate' as const,
  READ_LIMITED: '/read-limited' as const,
  PERSON_UPDATE: '/person/update' as const,
  ACTIVITIES_UPDATE: '/activities/update' as const,
  READ_PUBLIC: '/read-public' as const,
} as const;

export const ORCID_ENVIRONMENTS = {
  SANDBOX: 'sandbox' as const,
  PRODUCTION: 'production' as const,
} as const;

export const ORCID_URLS = {
  [ORCID_ENVIRONMENTS.SANDBOX]: {
    authUrl: 'https://sandbox.orcid.org/oauth/authorize',
    tokenUrl: 'https://sandbox.orcid.org/oauth/token',
    apiUrl: 'https://api.sandbox.orcid.org/v3.0',
  },
  [ORCID_ENVIRONMENTS.PRODUCTION]: {
    authUrl: 'https://orcid.org/oauth/authorize',
    tokenUrl: 'https://orcid.org/oauth/token',
    apiUrl: 'https://api.orcid.org/v3.0',
  },
} as const;

export const ORCID_WORK_TYPES = {
  JOURNAL_ARTICLE: 'JOURNAL_ARTICLE' as const,
  BOOK_CHAPTER: 'BOOK_CHAPTER' as const,
  BOOK: 'BOOK' as const,
  CONFERENCE_PAPER: 'CONFERENCE_PAPER' as const,
  WORKING_PAPER: 'WORKING_PAPER' as const,
  REPORT: 'REPORT' as const,
  DATA_SET: 'DATA_SET' as const,
  TEST: 'TEST' as const,
  OTHER: 'OTHER' as const,
} as const;