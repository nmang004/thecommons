/**
 * ORCID API Client for The Commons
 * Handles all ORCID API interactions including OAuth, profile fetching, and data synchronization
 */

import { 
  OrcidClientConfig,
  OrcidPersonResponse,
  OrcidWorksResponse,
  OrcidWork,
  OrcidTokenResponse,
  OrcidApiResponse,
  OrcidApiError,
  OrcidRateLimitInfo,
  OrcidActivitiesResponse,
  OrcidEnvironment,
  ORCID_URLS,
  ORCID_SCOPES,
  isOrcidTokenResponse,
  isOrcidPersonResponse,
  isOrcidWorksResponse
} from './types';
import { 
  getMockPersonData,
  getMockWorksData,
  getMockActivitiesData,
  mockTokenResponse,
  mockErrorResponses,
  simulateNetworkDelay,
  shouldSimulateError
} from './mock-data';

export class OrcidApiClient {
  private config: OrcidClientConfig;
  private isMockMode: boolean;

  constructor(config: Partial<OrcidClientConfig> = {}) {
    const environment: OrcidEnvironment = config.environment || 
      (process.env.ORCID_ENVIRONMENT as OrcidEnvironment) || 'sandbox';
    
    this.config = {
      clientId: config.clientId || process.env.ORCID_CLIENT_ID || '',
      clientSecret: config.clientSecret || process.env.ORCID_CLIENT_SECRET || '',
      environment,
      redirectUri: config.redirectUri || process.env.ORCID_REDIRECT_URI || '',
      scope: config.scope || ORCID_SCOPES.AUTHENTICATE,
      apiVersion: config.apiVersion || '3.0',
      urls: config.urls || ORCID_URLS[environment]
    };

    // Enable mock mode in development or when explicitly requested
    this.isMockMode = process.env.NODE_ENV === 'development' || 
                      process.env.ORCID_MOCK_MODE === 'true';
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthorizationUrl(state: string, scope?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      scope: scope || this.config.scope,
      redirect_uri: this.config.redirectUri,
      state
    });

    return `${this.config.urls.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(authorizationCode: string): Promise<OrcidApiResponse<OrcidTokenResponse>> {
    if (this.isMockMode) {
      await simulateNetworkDelay(500, 1500);
      
      if (shouldSimulateError(0.1)) {
        return {
          success: false,
          statusCode: 400,
          error: mockErrorResponses.INVALID_ORCID
        };
      }

      return {
        success: true,
        statusCode: 200,
        data: {
          ...mockTokenResponse,
          access_token: `mock_token_${Date.now()}`,
          refresh_token: `mock_refresh_${Date.now()}`
        }
      };
    }

    try {
      const response = await fetch(this.config.urls.tokenUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: this.config.redirectUri
        })
      });

      const data = await response.json();
      const rateLimitInfo = this.extractRateLimitInfo(response.headers);

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: data as OrcidApiError,
          rateLimitInfo
        };
      }

      if (!isOrcidTokenResponse(data)) {
        return {
          success: false,
          statusCode: 400,
          error: {
            error: 'invalid_response',
            'error-desc': 'Invalid token response format'
          }
        };
      }

      return {
        success: true,
        statusCode: response.status,
        data,
        rateLimitInfo
      };

    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        error: {
          error: 'network_error',
          'error-desc': 'Failed to connect to ORCID API',
          'developer-message': error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OrcidApiResponse<OrcidTokenResponse>> {
    if (this.isMockMode) {
      await simulateNetworkDelay(300, 800);
      
      return {
        success: true,
        statusCode: 200,
        data: {
          ...mockTokenResponse,
          access_token: `refreshed_token_${Date.now()}`,
          refresh_token: refreshToken // Usually the same refresh token
        }
      };
    }

    try {
      const response = await fetch(this.config.urls.tokenUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      const data = await response.json();
      const rateLimitInfo = this.extractRateLimitInfo(response.headers);

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: data as OrcidApiError,
          rateLimitInfo
        };
      }

      return {
        success: true,
        statusCode: response.status,
        data: data as OrcidTokenResponse,
        rateLimitInfo
      };

    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        error: {
          error: 'network_error',
          'error-desc': 'Failed to refresh token'
        }
      };
    }
  }

  /**
   * Get person profile data
   */
  async getPersonProfile(orcidId: string, accessToken: string): Promise<OrcidApiResponse<OrcidPersonResponse>> {
    if (this.isMockMode) {
      await simulateNetworkDelay(200, 800);
      
      const mockData = getMockPersonData(orcidId);
      if (!mockData) {
        return {
          success: false,
          statusCode: 404,
          error: {
            error: 'not_found',
            'error-desc': 'ORCID record not found'
          }
        };
      }

      if (shouldSimulateError(0.05)) {
        return {
          success: false,
          statusCode: 401,
          error: mockErrorResponses.TOKEN_EXPIRED
        };
      }

      return {
        success: true,
        statusCode: 200,
        data: mockData
      };
    }

    try {
      const url = `${this.config.urls.apiUrl}/${orcidId}/person`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      const rateLimitInfo = this.extractRateLimitInfo(response.headers);

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: data as OrcidApiError,
          rateLimitInfo
        };
      }

      if (!isOrcidPersonResponse(data)) {
        return {
          success: false,
          statusCode: 400,
          error: {
            error: 'invalid_response',
            'error-desc': 'Invalid person response format'
          }
        };
      }

      return {
        success: true,
        statusCode: response.status,
        data,
        rateLimitInfo
      };

    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        error: {
          error: 'network_error',
          'error-desc': 'Failed to fetch person profile'
        }
      };
    }
  }

  /**
   * Get works (publications) for an ORCID
   */
  async getWorks(orcidId: string, accessToken: string): Promise<OrcidApiResponse<OrcidWorksResponse>> {
    if (this.isMockMode) {
      await simulateNetworkDelay(300, 1200);
      
      const mockData = getMockWorksData(orcidId);
      if (!mockData) {
        return {
          success: true,
          statusCode: 200,
          data: { group: [] } // Empty works list
        };
      }

      if (shouldSimulateError(0.08)) {
        return {
          success: false,
          statusCode: 429,
          error: mockErrorResponses.RATE_LIMIT_EXCEEDED
        };
      }

      return {
        success: true,
        statusCode: 200,
        data: mockData
      };
    }

    try {
      const url = `${this.config.urls.apiUrl}/${orcidId}/works`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      const rateLimitInfo = this.extractRateLimitInfo(response.headers);

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: data as OrcidApiError,
          rateLimitInfo
        };
      }

      if (!isOrcidWorksResponse(data)) {
        return {
          success: false,
          statusCode: 400,
          error: {
            error: 'invalid_response',
            'error-desc': 'Invalid works response format'
          }
        };
      }

      return {
        success: true,
        statusCode: response.status,
        data,
        rateLimitInfo
      };

    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        error: {
          error: 'network_error',
          'error-desc': 'Failed to fetch works'
        }
      };
    }
  }

  /**
   * Get detailed work information by put-code
   */
  async getWorkDetails(orcidId: string, putCode: number, accessToken: string): Promise<OrcidApiResponse<OrcidWork>> {
    if (this.isMockMode) {
      await simulateNetworkDelay(200, 600);
      
      // In mock mode, return a basic work structure
      const mockWork: OrcidWork = {
        'put-code': putCode,
        title: {
          title: {
            value: `Mock Work ${putCode}`
          }
        },
        type: 'JOURNAL_ARTICLE',
        'journal-title': {
          value: 'Mock Journal'
        },
        'publication-date': {
          year: { value: '2023' },
          month: { value: '06' },
          day: { value: '15' }
        },
        'external-ids': {
          'external-id': [
            {
              'external-id-type': 'doi',
              'external-id-value': `10.1000/mock.${putCode}`,
              'external-id-relationship': 'SELF'
            }
          ]
        }
      };

      return {
        success: true,
        statusCode: 200,
        data: mockWork
      };
    }

    try {
      const url = `${this.config.urls.apiUrl}/${orcidId}/work/${putCode}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      const rateLimitInfo = this.extractRateLimitInfo(response.headers);

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: data as OrcidApiError,
          rateLimitInfo
        };
      }

      return {
        success: true,
        statusCode: response.status,
        data: data as OrcidWork,
        rateLimitInfo
      };

    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        error: {
          error: 'network_error',
          'error-desc': 'Failed to fetch work details'
        }
      };
    }
  }

  /**
   * Get activities (employments, educations, works) for an ORCID
   */
  async getActivities(orcidId: string, accessToken: string): Promise<OrcidApiResponse<OrcidActivitiesResponse>> {
    if (this.isMockMode) {
      await simulateNetworkDelay(400, 1500);
      
      const mockData = getMockActivitiesData(orcidId);
      if (!mockData) {
        return {
          success: false,
          statusCode: 404,
          error: {
            error: 'not_found',
            'error-desc': 'Activities not found'
          }
        };
      }

      return {
        success: true,
        statusCode: 200,
        data: mockData
      };
    }

    try {
      const url = `${this.config.urls.apiUrl}/${orcidId}/activities`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      const rateLimitInfo = this.extractRateLimitInfo(response.headers);

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: data as OrcidApiError,
          rateLimitInfo
        };
      }

      return {
        success: true,
        statusCode: response.status,
        data: data as OrcidActivitiesResponse,
        rateLimitInfo
      };

    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        error: {
          error: 'network_error',
          'error-desc': 'Failed to fetch activities'
        }
      };
    }
  }

  /**
   * Search ORCID registry (public search)
   */
  async searchOrcidRegistry(query: string): Promise<OrcidApiResponse<any>> {
    if (this.isMockMode) {
      await simulateNetworkDelay(300, 1000);
      
      // Return mock search results
      const mockResults = {
        'num-found': 2,
        'result': [
          {
            'orcid-identifier': {
              'uri': 'https://sandbox.orcid.org/0000-0002-1825-0097',
              'path': '0000-0002-1825-0097',
              'host': 'sandbox.orcid.org'
            }
          },
          {
            'orcid-identifier': {
              'uri': 'https://sandbox.orcid.org/0000-0001-5109-3700',
              'path': '0000-0001-5109-3700',
              'host': 'sandbox.orcid.org'
            }
          }
        ]
      };

      return {
        success: true,
        statusCode: 200,
        data: mockResults
      };
    }

    try {
      const url = `${this.config.urls.apiUrl}/search`;
      const params = new URLSearchParams({ q: query });
      
      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      const rateLimitInfo = this.extractRateLimitInfo(response.headers);

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: data as OrcidApiError,
          rateLimitInfo
        };
      }

      return {
        success: true,
        statusCode: response.status,
        data,
        rateLimitInfo
      };

    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        error: {
          error: 'network_error',
          'error-desc': 'Failed to search ORCID registry'
        }
      };
    }
  }

  /**
   * Validate an ORCID iD by attempting to fetch public data
   */
  async validateOrcidId(orcidId: string): Promise<OrcidApiResponse<boolean>> {
    if (this.isMockMode) {
      await simulateNetworkDelay(100, 300);
      
      // Consider all test ORCID iDs as valid
      const testIds = [
        '0000-0002-1825-0097',
        '0000-0001-5109-3700',
        '0000-0003-1415-9269',
        '0000-0002-7183-4567',
        '0000-0001-8271-5555',
        '0000-0003-9876-5432'
      ];
      
      const isValid = testIds.includes(orcidId);
      
      return {
        success: true,
        statusCode: isValid ? 200 : 404,
        data: isValid
      };
    }

    try {
      const url = `${this.config.urls.apiUrl}/${orcidId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const rateLimitInfo = this.extractRateLimitInfo(response.headers);
      const isValid = response.ok;

      return {
        success: true,
        statusCode: response.status,
        data: isValid,
        rateLimitInfo
      };

    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        error: {
          error: 'network_error',
          'error-desc': 'Failed to validate ORCID iD'
        }
      };
    }
  }

  /**
   * Extract rate limit information from response headers
   */
  private extractRateLimitInfo(headers: Headers): OrcidRateLimitInfo | undefined {
    const limit = headers.get('X-Rate-Limit-Limit');
    const remaining = headers.get('X-Rate-Limit-Remaining');
    const reset = headers.get('X-Rate-Limit-Reset');
    const retryAfter = headers.get('Retry-After');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        resetTime: new Date(parseInt(reset, 10) * 1000),
        retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined
      };
    }

    return undefined;
  }

  /**
   * Check if rate limit is approaching
   */
  isRateLimitApproaching(rateLimitInfo?: OrcidRateLimitInfo, threshold = 0.2): boolean {
    if (!rateLimitInfo) return false;
    
    const percentRemaining = rateLimitInfo.remaining / rateLimitInfo.limit;
    return percentRemaining < threshold;
  }

  /**
   * Calculate delay needed for rate limit compliance
   */
  calculateRateLimitDelay(rateLimitInfo?: OrcidRateLimitInfo): number {
    if (!rateLimitInfo || rateLimitInfo.remaining > 0) return 0;
    
    if (rateLimitInfo.retryAfter) {
      return rateLimitInfo.retryAfter * 1000; // Convert to milliseconds
    }
    
    const now = new Date();
    const resetTime = rateLimitInfo.resetTime;
    
    if (resetTime > now) {
      return resetTime.getTime() - now.getTime();
    }
    
    return 0;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<OrcidClientConfig> {
    return { ...this.config };
  }

  /**
   * Check if client is in mock mode
   */
  isMock(): boolean {
    return this.isMockMode;
  }

  /**
   * Enable or disable mock mode
   */
  setMockMode(enabled: boolean): void {
    this.isMockMode = enabled;
  }
}

// Default client instance
let defaultClient: OrcidApiClient | null = null;

/**
 * Get the default ORCID API client instance
 */
export function getOrcidClient(): OrcidApiClient {
  if (!defaultClient) {
    defaultClient = new OrcidApiClient();
  }
  return defaultClient;
}

/**
 * Create a new ORCID API client with custom configuration
 */
export function createOrcidClient(config: Partial<OrcidClientConfig>): OrcidApiClient {
  return new OrcidApiClient(config);
}

/**
 * Utility function to handle API errors consistently
 */
export function handleOrcidApiError(response: OrcidApiResponse<any>): string {
  if (response.error) {
    return response.error['user-message'] || 
           response.error['error-desc'] || 
           response.error.error ||
           'An unknown error occurred';
  }
  
  return `API request failed with status ${response.statusCode}`;
}

/**
 * Utility function to check if an API response indicates token expiration
 */
export function isTokenExpiredError(response: OrcidApiResponse<any>): boolean {
  return response.error?.error === 'invalid_token' ||
         response.statusCode === 401;
}

/**
 * Utility function to check if an API response indicates rate limiting
 */
export function isRateLimitError(response: OrcidApiResponse<any>): boolean {
  return response.error?.error === 'rate_limit_exceeded' ||
         response.statusCode === 429;
}