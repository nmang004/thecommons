/**
 * Mock ORCID data for development and testing
 * Contains realistic test data that mirrors actual ORCID API responses
 */

import { 
  OrcidPersonResponse, 
  OrcidWorksResponse, 
  OrcidWork,
  OrcidTokenResponse,
  OrcidActivitiesResponse,
  OrcidPublicationImport,
} from './types';

// Sandbox test ORCID iDs
export const SANDBOX_TEST_ORCIDS = {
  // Dr. Sarah Chen - Quantum Computing Researcher (Full profile)
  FULL_PROFILE: '0000-0002-1825-0097',
  
  // Dr. James Wilson - Biomedical Engineer (Basic profile)
  BASIC_PROFILE: '0000-0001-5109-3700',
  
  // Dr. Maria Rodriguez - Climate Scientist (With affiliations)
  WITH_AFFILIATIONS: '0000-0003-1415-9269',
  
  // Dr. Alex Kim - Computer Science (Minimal data)
  MINIMAL_DATA: '0000-0002-7183-4567',
  
  // Dr. Emily Johnson - Neuroscientist (Multiple works)
  MULTIPLE_WORKS: '0000-0001-8271-5555',
  
  // Dr. David Thompson - Physics (Recent graduate)
  RECENT_GRADUATE: '0000-0003-9876-5432'
} as const;

// Mock token response for OAuth flow
export const mockTokenResponse: OrcidTokenResponse = {
  access_token: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  token_type: 'bearer',
  refresh_token: 'r1e2f3r4-e5s6-h7t8-o9k0-e1n2s3a4m5p6',
  expires_in: 631138518,
  scope: '/authenticate',
  name: 'Dr. Sarah Chen',
  orcid: '0000-0002-1825-0097'
};

// Mock person responses for different test users
export const mockPersonResponses: Record<string, OrcidPersonResponse> = {
  '0000-0002-1825-0097': {
    'orcid-identifier': {
      uri: 'https://sandbox.orcid.org/0000-0002-1825-0097',
      path: '0000-0002-1825-0097',
      host: 'sandbox.orcid.org'
    },
    person: {
      'last-modified-date': {
        value: 1694520000000
      },
      name: {
        'given-names': {
          value: 'Sarah'
        },
        'family-name': {
          value: 'Chen'
        },
        'credit-name': {
          value: 'Dr. Sarah Chen'
        }
      },
      biography: {
        value: 'Quantum computing researcher at Stanford University with focus on machine learning applications in quantum systems. Interested in bridging classical and quantum computing paradigms.'
      },
      'researcher-urls': {
        'last-modified-date': {
          value: 1694520000000
        },
        'researcher-url': [
          {
            'url-name': 'Stanford Profile',
            url: {
              value: 'https://profiles.stanford.edu/sarah-chen'
            },
            'created-date': {
              value: 1694520000000
            }
          },
          {
            'url-name': 'Google Scholar',
            url: {
              value: 'https://scholar.google.com/citations?user=abc123'
            }
          }
        ]
      },
      emails: {
        'last-modified-date': {
          value: 1694520000000
        },
        email: [
          {
            email: 'sarah.chen@stanford.edu',
            verified: true,
            primary: true,
            visibility: 'PUBLIC'
          }
        ]
      },
      keywords: {
        'last-modified-date': {
          value: 1694520000000
        },
        keyword: [
          {
            'put-code': 1,
            content: 'Quantum Computing',
            'created-date': {
              value: 1694520000000
            },
            'last-modified-date': {
              value: 1694520000000
            }
          },
          {
            'put-code': 2,
            content: 'Machine Learning',
            'created-date': {
              value: 1694520000000
            },
            'last-modified-date': {
              value: 1694520000000
            }
          },
          {
            'put-code': 3,
            content: 'Quantum Machine Learning',
            'created-date': {
              value: 1694520000000
            },
            'last-modified-date': {
              value: 1694520000000
            }
          }
        ]
      }
    }
  },

  '0000-0001-5109-3700': {
    'orcid-identifier': {
      uri: 'https://sandbox.orcid.org/0000-0001-5109-3700',
      path: '0000-0001-5109-3700',
      host: 'sandbox.orcid.org'
    },
    person: {
      name: {
        'given-names': {
          value: 'James'
        },
        'family-name': {
          value: 'Wilson'
        },
        'credit-name': {
          value: 'Dr. James Wilson'
        }
      },
      biography: {
        value: 'Biomedical engineer specializing in medical devices and biomaterials research. Associate Professor at MIT.'
      },
      emails: {
        email: [
          {
            email: 'james.wilson@mit.edu',
            verified: true,
            primary: true
          }
        ]
      }
    }
  },

  '0000-0003-1415-9269': {
    'orcid-identifier': {
      uri: 'https://sandbox.orcid.org/0000-0003-1415-9269',
      path: '0000-0003-1415-9269',
      host: 'sandbox.orcid.org'
    },
    person: {
      name: {
        'given-names': {
          value: 'Maria'
        },
        'family-name': {
          value: 'Rodriguez'
        },
        'credit-name': {
          value: 'Dr. Maria Rodriguez'
        }
      },
      biography: {
        value: 'Climate scientist at NOAA focusing on atmospheric modeling and climate change research. Lead researcher on multiple international climate projects.'
      },
      'researcher-urls': {
        'researcher-url': [
          {
            'url-name': 'NOAA Profile',
            url: {
              value: 'https://www.noaa.gov/staff/maria-rodriguez'
            }
          },
          {
            'url-name': 'ResearchGate',
            url: {
              value: 'https://www.researchgate.net/profile/Maria-Rodriguez-123'
            }
          }
        ]
      },
      emails: {
        email: [
          {
            email: 'maria.rodriguez@noaa.gov',
            verified: true,
            primary: true
          }
        ]
      }
    }
  }
};

// Mock works responses
export const mockWorksResponses: Record<string, OrcidWorksResponse> = {
  '0000-0002-1825-0097': {
    'last-modified-date': {
      value: 1694520000000
    },
    group: [
      {
        'last-modified-date': {
          value: 1694520000000
        },
        'work-summary': [
          {
            'put-code': 12345,
            title: {
              title: {
                value: 'Quantum Machine Learning: Bridging Classical and Quantum Computing'
              }
            },
            'journal-title': {
              value: 'Nature Quantum Information'
            },
            'publication-date': {
              year: {
                value: '2023'
              },
              month: {
                value: '06'
              },
              day: {
                value: '15'
              }
            },
            type: 'JOURNAL_ARTICLE',
            'external-ids': {
              'external-id': [
                {
                  'external-id-type': 'doi',
                  'external-id-value': '10.1038/s41534-023-00723-0',
                  'external-id-relationship': 'SELF'
                }
              ]
            },
            'created-date': {
              value: 1694520000000
            },
            'last-modified-date': {
              value: 1694520000000
            }
          },
          {
            'put-code': 12346,
            title: {
              title: {
                value: 'Variational Quantum Algorithms for Optimization'
              }
            },
            'journal-title': {
              value: 'Physical Review A'
            },
            'publication-date': {
              year: {
                value: '2023'
              },
              month: {
                value: '04'
              },
              day: {
                value: '10'
              }
            },
            type: 'JOURNAL_ARTICLE',
            'external-ids': {
              'external-id': [
                {
                  'external-id-type': 'doi',
                  'external-id-value': '10.1103/PhysRevA.107.042401',
                  'external-id-relationship': 'SELF'
                }
              ]
            },
            'created-date': {
              value: 1694520000000
            },
            'last-modified-date': {
              value: 1694520000000
            }
          }
        ]
      }
    ]
  },

  '0000-0001-5109-3700': {
    group: [
      {
        'last-modified-date': {
          value: 1694520000000
        },
        'work-summary': [
          {
            'put-code': 67890,
            title: {
              title: {
                value: 'Novel Biomaterials for Cardiac Stent Applications'
              }
            },
            'journal-title': {
              value: 'Biomaterials'
            },
            'publication-date': {
              year: {
                value: '2023'
              },
              month: {
                value: '03'
              }
            },
            type: 'JOURNAL_ARTICLE',
            'external-ids': {
              'external-id': [
                {
                  'external-id-type': 'doi',
                  'external-id-value': '10.1016/j.biomaterials.2023.121456',
                  'external-id-relationship': 'SELF'
                }
              ]
            },
            'created-date': {
              value: 1694520000000
            },
            'last-modified-date': {
              value: 1694520000000
            }
          }
        ]
      }
    ]
  }
};

// Mock detailed work responses
export const mockDetailedWorks: Record<number, OrcidWork> = {
  12345: {
    'put-code': 12345,
    title: {
      title: {
        value: 'Quantum Machine Learning: Bridging Classical and Quantum Computing'
      },
      subtitle: {
        value: 'A Comprehensive Review'
      }
    },
    'journal-title': {
      value: 'Nature Quantum Information'
    },
    'short-description': 'This paper reviews the current state of quantum machine learning and proposes new approaches for bridging classical and quantum computing paradigms.',
    citation: {
      'citation-type': 'FORMATTED_APA',
      'citation-value': 'Chen, S. (2023). Quantum Machine Learning: Bridging Classical and Quantum Computing. Nature Quantum Information, 4, 123.'
    },
    type: 'JOURNAL_ARTICLE',
    'publication-date': {
      year: {
        value: '2023'
      },
      month: {
        value: '06'
      },
      day: {
        value: '15'
      }
    },
    'external-ids': {
      'external-id': [
        {
          'external-id-type': 'doi',
          'external-id-value': '10.1038/s41534-023-00723-0',
          'external-id-url': {
            value: 'https://doi.org/10.1038/s41534-023-00723-0'
          },
          'external-id-relationship': 'SELF'
        }
      ]
    },
    url: {
      value: 'https://www.nature.com/articles/s41534-023-00723-0'
    },
    contributors: {
      contributor: [
        {
          'credit-name': {
            value: 'Dr. Sarah Chen'
          },
          'contributor-attributes': {
            'contributor-sequence': 'FIRST',
            'contributor-role': 'AUTHOR'
          }
        }
      ]
    },
    'created-date': {
      value: 1694520000000
    },
    'last-modified-date': {
      value: 1694520000000
    }
  }
};

// Mock activities responses with employments
export const mockActivitiesResponses: Record<string, OrcidActivitiesResponse> = {
  '0000-0002-1825-0097': {
    'orcid-identifier': {
      uri: 'https://sandbox.orcid.org/0000-0002-1825-0097',
      path: '0000-0002-1825-0097',
      host: 'sandbox.orcid.org'
    },
    'activities-summary': {
      employments: {
        'employment-summary': [
          {
            'put-code': 1001,
            organization: {
              name: 'Stanford University',
              address: {
                city: 'Stanford',
                region: 'CA',
                country: 'US'
              },
              'disambiguated-organization': {
                'disambiguated-organization-identifier': 'https://ror.org/00f54p054',
                'disambiguation-source': 'ROR'
              }
            },
            'role-title': 'Assistant Professor',
            'department-name': 'Computer Science Department',
            'start-date': {
              year: {
                value: '2021'
              },
              month: {
                value: '09'
              }
            },
            'end-date': null,
            'created-date': {
              value: 1694520000000
            },
            'last-modified-date': {
              value: 1694520000000
            }
          }
        ]
      },
      educations: {
        'education-summary': [
          {
            'put-code': 2001,
            organization: {
              name: 'MIT',
              address: {
                city: 'Cambridge',
                region: 'MA',
                country: 'US'
              }
            },
            'role-title': 'Ph.D. in Computer Science',
            'department-name': 'Department of Electrical Engineering and Computer Science',
            'start-date': {
              year: {
                value: '2016'
              }
            },
            'end-date': {
              year: {
                value: '2020'
              }
            }
          },
          {
            'put-code': 2002,
            organization: {
              name: 'UC Berkeley',
              address: {
                city: 'Berkeley',
                region: 'CA',
                country: 'US'
              }
            },
            'role-title': 'B.S. in Computer Science',
            'department-name': 'Department of Electrical Engineering and Computer Sciences',
            'start-date': {
              year: {
                value: '2012'
              }
            },
            'end-date': {
              year: {
                value: '2016'
              }
            }
          }
        ]
      },
      works: mockWorksResponses['0000-0002-1825-0097']
    }
  }
};

// Mock publication imports for UI testing
export const mockPublicationImports: Record<string, OrcidPublicationImport[]> = {
  '0000-0002-1825-0097': [
    {
      putCode: '12345',
      title: 'Quantum Machine Learning: Bridging Classical and Quantum Computing',
      journal: 'Nature Quantum Information',
      doi: '10.1038/s41534-023-00723-0',
      publicationDate: {
        year: '2023',
        month: '06',
        day: '15'
      },
      type: 'JOURNAL_ARTICLE',
      isSelected: true,
      existsLocally: false,
      conflictsWithLocal: false
    },
    {
      putCode: '12346',
      title: 'Variational Quantum Algorithms for Optimization',
      journal: 'Physical Review A',
      doi: '10.1103/PhysRevA.107.042401',
      publicationDate: {
        year: '2023',
        month: '04',
        day: '10'
      },
      type: 'JOURNAL_ARTICLE',
      isSelected: true,
      existsLocally: false,
      conflictsWithLocal: false
    },
    {
      putCode: '12347',
      title: 'Error Correction in Near-term Quantum Devices',
      journal: 'IEEE Transactions on Quantum Engineering',
      doi: '10.1109/TQCE.2023.3275421',
      publicationDate: {
        year: '2023',
        month: '08'
      },
      type: 'JOURNAL_ARTICLE',
      isSelected: false,
      existsLocally: true,
      conflictsWithLocal: false
    },
    {
      putCode: '12348',
      title: 'Quantum Computing Applications in Drug Discovery',
      journal: 'Nature Reviews Drug Discovery',
      publicationDate: {
        year: '2024',
        month: '01'
      },
      type: 'JOURNAL_ARTICLE',
      isSelected: true,
      existsLocally: false,
      conflictsWithLocal: false
    }
  ],

  '0000-0001-5109-3700': [
    {
      putCode: '67890',
      title: 'Novel Biomaterials for Cardiac Stent Applications',
      journal: 'Biomaterials',
      doi: '10.1016/j.biomaterials.2023.121456',
      publicationDate: {
        year: '2023',
        month: '03',
        day: '15'
      },
      type: 'JOURNAL_ARTICLE',
      isSelected: true,
      existsLocally: false,
      conflictsWithLocal: false
    },
    {
      putCode: '67891',
      title: 'Biocompatibility Assessment of 3D Printed Medical Devices',
      journal: 'Journal of Biomedical Materials Research Part A',
      doi: '10.1002/jbm.a.37345',
      publicationDate: {
        year: '2023',
        month: '01',
        day: '20'
      },
      type: 'JOURNAL_ARTICLE',
      isSelected: false,
      existsLocally: true,
      conflictsWithLocal: true
    }
  ]
};

// Mock error responses for testing error handling
export const mockErrorResponses = {
  TOKEN_EXPIRED: {
    error: 'invalid_token',
    'error-desc': 'The access token provided is invalid',
    'developer-message': 'The access token has expired',
    'user-message': 'Your ORCID connection has expired. Please reconnect your account.',
    'error-code': 401,
    'more-info': 'https://info.orcid.org/documentation/api-troubleshooting/'
  },
  RATE_LIMIT_EXCEEDED: {
    error: 'rate_limit_exceeded',
    'error-desc': 'Too many requests',
    'developer-message': 'Rate limit of 24 requests per second exceeded',
    'user-message': 'Too many requests. Please try again in a moment.',
    'error-code': 429
  },
  INVALID_ORCID: {
    error: 'invalid_orcid',
    'error-desc': 'Invalid ORCID iD format',
    'developer-message': 'The provided ORCID iD does not match the expected format',
    'user-message': 'The ORCID iD format is invalid. Please check and try again.',
    'error-code': 400
  },
  SCOPE_INSUFFICIENT: {
    error: 'insufficient_scope',
    'error-desc': 'The request requires higher privileges than provided',
    'developer-message': 'The access token does not have sufficient scope for this operation',
    'user-message': 'Additional permissions are required to perform this action.',
    'error-code': 403
  },
  NETWORK_ERROR: {
    error: 'network_error',
    'error-desc': 'Unable to connect to ORCID servers',
    'developer-message': 'Network timeout or connectivity issue',
    'user-message': 'Unable to connect to ORCID. Please check your internet connection and try again.',
    'error-code': 0
  }
};

// Mock rate limit headers
export const mockRateLimitHeaders = {
  normal: {
    'X-Rate-Limit-Limit': '24',
    'X-Rate-Limit-Remaining': '20',
    'X-Rate-Limit-Reset': '1694523600'
  },
  nearLimit: {
    'X-Rate-Limit-Limit': '24',
    'X-Rate-Limit-Remaining': '2',
    'X-Rate-Limit-Reset': '1694523600'
  },
  exceeded: {
    'X-Rate-Limit-Limit': '24',
    'X-Rate-Limit-Remaining': '0',
    'X-Rate-Limit-Reset': '1694523600',
    'Retry-After': '60'
  }
};

// Helper function to get mock data for a specific ORCID iD
export function getMockPersonData(orcidId: string): OrcidPersonResponse | null {
  return mockPersonResponses[orcidId] || null;
}

export function getMockWorksData(orcidId: string): OrcidWorksResponse | null {
  return mockWorksResponses[orcidId] || null;
}

export function getMockActivitiesData(orcidId: string): OrcidActivitiesResponse | null {
  return mockActivitiesResponses[orcidId] || null;
}

export function getMockPublicationImports(orcidId: string): OrcidPublicationImport[] {
  return mockPublicationImports[orcidId] || [];
}

// Function to simulate API delays for realistic testing
export function simulateNetworkDelay(min = 200, max = 1000): Promise<void> {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Function to simulate API errors based on probability
export function shouldSimulateError(errorRate = 0.1): boolean {
  return Math.random() < errorRate;
}

// Function to get random error response
export function getRandomErrorResponse() {
  const errors = Object.values(mockErrorResponses);
  return errors[Math.floor(Math.random() * errors.length)];
}

// Export all test ORCID iDs as array for convenience
export const ALL_TEST_ORCIDS = Object.values(SANDBOX_TEST_ORCIDS);

// Export mapping of test users for easy reference
export const TEST_USER_PROFILES = {
  [SANDBOX_TEST_ORCIDS.FULL_PROFILE]: {
    name: 'Dr. Sarah Chen',
    affiliation: 'Stanford University',
    field: 'Quantum Computing',
    description: 'Full profile with publications and affiliations'
  },
  [SANDBOX_TEST_ORCIDS.BASIC_PROFILE]: {
    name: 'Dr. James Wilson',
    affiliation: 'MIT',
    field: 'Biomedical Engineering',
    description: 'Basic profile with minimal data'
  },
  [SANDBOX_TEST_ORCIDS.WITH_AFFILIATIONS]: {
    name: 'Dr. Maria Rodriguez',
    affiliation: 'NOAA Climate Center',
    field: 'Climate Science',
    description: 'Profile with extensive employment and education history'
  },
  [SANDBOX_TEST_ORCIDS.MINIMAL_DATA]: {
    name: 'Dr. Alex Kim',
    affiliation: 'UC Berkeley',
    field: 'Computer Science',
    description: 'Minimal profile data for testing edge cases'
  },
  [SANDBOX_TEST_ORCIDS.MULTIPLE_WORKS]: {
    name: 'Dr. Emily Johnson',
    affiliation: 'Harvard Medical School',
    field: 'Neuroscience',
    description: 'Profile with many publications for import testing'
  },
  [SANDBOX_TEST_ORCIDS.RECENT_GRADUATE]: {
    name: 'Dr. David Thompson',
    affiliation: 'Caltech',
    field: 'Theoretical Physics',
    description: 'Recent graduate profile for testing career stage scenarios'
  }
} as const;