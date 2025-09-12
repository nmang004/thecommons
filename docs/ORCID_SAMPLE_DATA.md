# ORCID Sample Data for The Commons

## Overview

This document provides comprehensive sample data for testing ORCID integration in The Commons platform. It includes test ORCID iDs, mock API responses, database seed data, and testing scenarios.

## Test ORCID iDs (Sandbox Environment)

### Primary Test Accounts

These ORCID iDs are available in the ORCID sandbox environment for testing:

```javascript
export const SANDBOX_TEST_ORCIDS = {
  // Dr. Sarah Chen - Quantum Computing Researcher
  FULL_PROFILE: '0000-0002-1825-0097',
  
  // Dr. James Wilson - Biomedical Engineer  
  BASIC_PROFILE: '0000-0001-5109-3700',
  
  // Dr. Maria Rodriguez - Climate Scientist
  WITH_AFFILIATIONS: '0000-0003-1415-9269',
  
  // Dr. Alex Kim - Computer Science
  MINIMAL_DATA: '0000-0002-7183-4567',
  
  // Dr. Emily Johnson - Neuroscientist
  MULTIPLE_WORKS: '0000-0001-8271-5555',
  
  // Dr. David Thompson - Physics
  RECENT_GRADUATE: '0000-0003-9876-5432'
};
```

### Test Account Details

#### Dr. Sarah Chen (0000-0002-1825-0097)
- **Institution**: Stanford University
- **Department**: Computer Science
- **Specialization**: Quantum Computing, Machine Learning
- **Publications**: 15 peer-reviewed papers
- **H-Index**: 12
- **Status**: Verified with multiple affiliations

#### Dr. James Wilson (0000-0001-5109-3700)
- **Institution**: MIT
- **Department**: Biomedical Engineering
- **Specialization**: Medical Devices, Biomaterials
- **Publications**: 8 peer-reviewed papers
- **H-Index**: 7
- **Status**: Basic profile with essential data

#### Dr. Maria Rodriguez (0000-0003-1415-9269)
- **Institution**: NOAA Climate Center
- **Department**: Atmospheric Sciences
- **Specialization**: Climate Modeling, Environmental Science
- **Publications**: 22 peer-reviewed papers
- **H-Index**: 18
- **Status**: Full profile with extensive work history

## Mock ORCID API Responses

### Profile Response Example

```json
{
  "orcid-identifier": {
    "uri": "https://sandbox.orcid.org/0000-0002-1825-0097",
    "path": "0000-0002-1825-0097",
    "host": "sandbox.orcid.org"
  },
  "person": {
    "name": {
      "given-names": {
        "value": "Sarah"
      },
      "family-name": {
        "value": "Chen"
      },
      "credit-name": {
        "value": "Dr. Sarah Chen"
      }
    },
    "biography": {
      "value": "Quantum computing researcher at Stanford University with focus on machine learning applications in quantum systems."
    },
    "researcher-urls": {
      "researcher-url": [
        {
          "url-name": "Stanford Profile",
          "url": {
            "value": "https://profiles.stanford.edu/sarah-chen"
          }
        }
      ]
    },
    "emails": {
      "email": [
        {
          "email": "sarah.chen@stanford.edu",
          "verified": true,
          "primary": true
        }
      ]
    }
  }
}
```

### Works (Publications) Response

```json
{
  "group": [
    {
      "last-modified-date": {
        "value": 1640995200000
      },
      "work-summary": [
        {
          "put-code": 12345,
          "title": {
            "title": {
              "value": "Quantum Machine Learning: Bridging Classical and Quantum Computing"
            }
          },
          "journal-title": {
            "value": "Nature Quantum Information"
          },
          "publication-date": {
            "year": {
              "value": "2023"
            },
            "month": {
              "value": "06"
            },
            "day": {
              "value": "15"
            }
          },
          "type": "journal-article",
          "external-ids": {
            "external-id": [
              {
                "external-id-type": "doi",
                "external-id-value": "10.1038/s41534-023-00723-0"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### Employment Response

```json
{
  "employment-summary": [
    {
      "put-code": 67890,
      "organization": {
        "name": "Stanford University",
        "address": {
          "city": "Stanford",
          "region": "CA",
          "country": "US"
        }
      },
      "role-title": "Assistant Professor",
      "department-name": "Computer Science Department",
      "start-date": {
        "year": {
          "value": "2021"
        },
        "month": {
          "value": "09"
        }
      },
      "end-date": null
    }
  ]
}
```

## Database Seed Data

### Sample Profiles with ORCID Integration

```sql
-- Update existing profiles with ORCID data
UPDATE profiles SET 
  orcid = '0000-0002-1825-0097',
  orcid_verified = true,
  orcid_connected_at = '2024-01-15T10:30:00Z',
  orcid_last_sync = '2024-09-12T09:15:00Z',
  h_index = 12,
  total_publications = 15,
  bio = 'Quantum computing researcher at Stanford University with focus on machine learning applications in quantum systems.'
WHERE email = 'sarah.chen@stanford.edu';

UPDATE profiles SET 
  orcid = '0000-0001-5109-3700',
  orcid_verified = true,
  orcid_connected_at = '2024-02-20T14:45:00Z',
  orcid_last_sync = '2024-09-10T16:20:00Z',
  h_index = 7,
  total_publications = 8,
  bio = 'Biomedical engineer specializing in medical devices and biomaterials research.'
WHERE email = 'james.wilson@mit.edu';

UPDATE profiles SET 
  orcid = '0000-0003-1415-9269',
  orcid_verified = true,
  orcid_connected_at = '2024-03-10T11:00:00Z',
  orcid_last_sync = '2024-09-11T13:30:00Z',
  h_index = 18,
  total_publications = 22,
  bio = 'Climate scientist at NOAA focusing on atmospheric modeling and climate change research.'
WHERE email = 'maria.rodriguez@noaa.gov';
```

### Sample Co-authors with ORCID

```sql
-- Add ORCID data to existing co-authors
UPDATE manuscript_coauthors SET 
  orcid = '0000-0002-7183-4567'
WHERE name = 'Dr. Alex Kim' AND email = 'alex.kim@berkeley.edu';

UPDATE manuscript_coauthors SET 
  orcid = '0000-0001-8271-5555'
WHERE name = 'Dr. Emily Johnson' AND email = 'emily.johnson@harvard.edu';

UPDATE manuscript_coauthors SET 
  orcid = '0000-0003-9876-5432'
WHERE name = 'Dr. David Thompson' AND email = 'david.thompson@caltech.edu';
```

### Sample ORCID Sync History

```sql
INSERT INTO orcid_sync_history (user_id, sync_type, items_synced, status, synced_at, metadata) VALUES
((SELECT id FROM profiles WHERE orcid = '0000-0002-1825-0097'), 'profile', 1, 'success', '2024-09-12T09:15:00Z', '{"fields_updated": ["bio", "affiliation", "website_url"]}'),
((SELECT id FROM profiles WHERE orcid = '0000-0002-1825-0097'), 'publications', 5, 'success', '2024-09-12T09:20:00Z', '{"new_publications": 2, "updated_publications": 3}'),
((SELECT id FROM profiles WHERE orcid = '0000-0001-5109-3700'), 'profile', 1, 'success', '2024-09-10T16:20:00Z', '{"fields_updated": ["bio", "h_index"]}'),
((SELECT id FROM profiles WHERE orcid = '0000-0003-1415-9269'), 'affiliations', 3, 'success', '2024-09-11T13:30:00Z', '{"affiliations_added": 1, "affiliations_updated": 2}');
```

## Mock Service Implementation

### TypeScript Mock Data

Create `/lib/orcid/mock-data.ts`:

```typescript
export interface MockOrcidProfile {
  orcidId: string;
  name: {
    givenNames: string;
    familyName: string;
    creditName?: string;
  };
  biography?: string;
  affiliation: {
    organization: string;
    department: string;
    role: string;
  }[];
  works: MockWork[];
  education: MockEducation[];
  emails: { email: string; verified: boolean; primary: boolean }[];
}

export interface MockWork {
  title: string;
  journal: string;
  year: number;
  doi?: string;
  type: 'journal-article' | 'conference-paper' | 'book-chapter';
}

export interface MockEducation {
  institution: string;
  degree: string;
  year: number;
}

export const mockOrcidProfiles: Record<string, MockOrcidProfile> = {
  '0000-0002-1825-0097': {
    orcidId: '0000-0002-1825-0097',
    name: {
      givenNames: 'Sarah',
      familyName: 'Chen',
      creditName: 'Dr. Sarah Chen'
    },
    biography: 'Quantum computing researcher at Stanford University with focus on machine learning applications in quantum systems.',
    affiliation: [
      {
        organization: 'Stanford University',
        department: 'Computer Science Department',
        role: 'Assistant Professor'
      }
    ],
    works: [
      {
        title: 'Quantum Machine Learning: Bridging Classical and Quantum Computing',
        journal: 'Nature Quantum Information',
        year: 2023,
        doi: '10.1038/s41534-023-00723-0',
        type: 'journal-article'
      },
      {
        title: 'Variational Quantum Algorithms for Optimization',
        journal: 'Physical Review A',
        year: 2023,
        doi: '10.1103/PhysRevA.107.042401',
        type: 'journal-article'
      }
    ],
    education: [
      {
        institution: 'MIT',
        degree: 'Ph.D. in Computer Science',
        year: 2020
      },
      {
        institution: 'UC Berkeley',
        degree: 'B.S. in Computer Science',
        year: 2016
      }
    ],
    emails: [
      {
        email: 'sarah.chen@stanford.edu',
        verified: true,
        primary: true
      }
    ]
  },
  
  '0000-0001-5109-3700': {
    orcidId: '0000-0001-5109-3700',
    name: {
      givenNames: 'James',
      familyName: 'Wilson',
      creditName: 'Dr. James Wilson'
    },
    biography: 'Biomedical engineer specializing in medical devices and biomaterials research.',
    affiliation: [
      {
        organization: 'MIT',
        department: 'Biomedical Engineering',
        role: 'Associate Professor'
      }
    ],
    works: [
      {
        title: 'Novel Biomaterials for Cardiac Stent Applications',
        journal: 'Biomaterials',
        year: 2023,
        doi: '10.1016/j.biomaterials.2023.121456',
        type: 'journal-article'
      }
    ],
    education: [
      {
        institution: 'Johns Hopkins University',
        degree: 'Ph.D. in Biomedical Engineering',
        year: 2018
      }
    ],
    emails: [
      {
        email: 'james.wilson@mit.edu',
        verified: true,
        primary: true
      }
    ]
  }
};

// Mock API responses
export const mockTokenResponse = {
  access_token: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  token_type: 'bearer',
  refresh_token: 'r1e2f3r4-e5s6-h7t8-o9k0-e1n2s3a4m5p6',
  expires_in: 631138518,
  scope: '/authenticate',
  name: 'Dr. Sarah Chen',
  orcid: '0000-0002-1825-0097'
};
```

## Testing Scenarios

### Scenario 1: First-Time ORCID Connection

**Setup**: User with existing profile, no ORCID connection
**Test Data**: Use profile for sarah.chen@stanford.edu
**Expected Result**: 
- ORCID successfully linked
- Profile updated with ORCID data
- Verification badge appears
- Sync history record created

### Scenario 2: Profile Data Conflict Resolution

**Setup**: User profile has different affiliation than ORCID
**Test Data**: Local profile shows "University of California" but ORCID shows "Stanford University"
**Expected Result**:
- User prompted to resolve conflict
- Can choose to keep local data or import ORCID data
- Decision recorded in sync history

### Scenario 3: Publication Import

**Setup**: ORCID profile has publications not in local system
**Test Data**: Use 0000-0002-1825-0097 with multiple works
**Expected Result**:
- Publications listed for import
- User can select which to import
- DOI validation performed
- Publications added to user's profile

### Scenario 4: Token Refresh

**Setup**: Expired access token
**Test Data**: Mock expired token scenario
**Expected Result**:
- Refresh token used automatically
- New access token obtained
- Operation continues seamlessly
- Token refresh logged

### Scenario 5: API Error Handling

**Setup**: ORCID API unavailable or rate limited
**Test Data**: Mock API error responses
**Expected Result**:
- Graceful error handling
- User notified of temporary issue
- Retry logic implemented
- Error logged for debugging

### Scenario 6: Co-author Verification

**Setup**: Manuscript submission with co-author ORCID iDs
**Test Data**: Multiple test ORCID iDs as co-authors
**Expected Result**:
- Each ORCID validated
- Invalid ORCIDs flagged
- Verification badges shown for valid ORCIDs
- Warning for unverified co-authors

## Test Data Maintenance

### Regular Updates

1. **Monthly**: Verify sandbox test accounts are active
2. **Quarterly**: Update mock data to reflect current ORCID API responses
3. **Before Major Releases**: Full test data validation
4. **API Version Changes**: Update response formats

### Test Account Management

- Keep sandbox accounts active by periodic login
- Update test publications annually
- Maintain diverse test scenarios
- Document any changes to test data

### Mock Data Synchronization

- Align mock responses with real ORCID API
- Update when ORCID API changes
- Validate mock data structure matches production
- Test with both mock and live sandbox data

## Performance Testing

### Load Testing Scenarios

```javascript
const loadTestScenarios = {
  // Concurrent ORCID connections
  concurrent_connections: {
    users: 100,
    duration: '5m',
    scenario: 'oauth_flow'
  },
  
  // Bulk profile sync
  bulk_sync: {
    users: 50,
    duration: '10m',
    scenario: 'profile_import'
  },
  
  // API rate limit testing
  rate_limit_test: {
    users: 1,
    requests_per_second: 30,
    duration: '2m'
  }
};
```

### Expected Performance Metrics

- OAuth flow completion: < 5 seconds
- Profile import: < 10 seconds
- Publication sync: < 15 seconds for 10 works
- Token refresh: < 2 seconds
- Error recovery: < 3 seconds

## Security Testing

### Test Cases

1. **State Parameter Validation**: Verify CSRF protection
2. **Token Encryption**: Ensure tokens stored securely
3. **Scope Validation**: Verify only requested scopes granted
4. **Redirect URI Validation**: Test against URI manipulation
5. **Token Expiration**: Verify expired tokens handled properly

### Security Test Data

```javascript
const securityTestCases = {
  // Invalid redirect URI
  malicious_redirect: {
    redirect_uri: 'https://malicious-site.com/callback',
    expected_result: 'error'
  },
  
  // Missing state parameter
  missing_state: {
    state: null,
    expected_result: 'csrf_error'
  },
  
  // Expired token usage
  expired_token: {
    token: 'expired_token_value',
    expected_result: 'token_expired'
  }
};
```

This comprehensive sample data setup ensures thorough testing of all ORCID integration features while maintaining realistic test scenarios that mirror production use cases.