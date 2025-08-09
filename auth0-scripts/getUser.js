/**
 * Auth0 Custom Database - Get User Script
 * This script fetches user profile data from Supabase by email
 * Place this in the "Get User" tab of your Auth0 Custom Database configuration
 */

function getUser(email, callback) {
  // Import Supabase client library
  const { createClient } = require('@supabase/supabase-js');

  // Get configuration from Auth0 environment variables
  const supabaseUrl = configuration.SUPABASE_URL;
  const supabaseKey = configuration.SUPABASE_SERVICE_KEY;

  // Validate configuration
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration missing');
    return callback(new Error('Database configuration error'));
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Query the profiles table for the user
  supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      role,
      affiliation,
      orcid,
      bio,
      expertise,
      h_index,
      created_at
    `)
    .eq('email', email)
    .single()
    .then(({ data: profile, error }) => {
      if (error || !profile) {
        // User not found in profiles table - this is not an error for password reset flows
        console.log('User not found in profiles table:', email);
        return callback(null);
      }

      // Construct user profile for Auth0
      const userProfile = {
        user_id: profile.id,
        email: profile.email,
        email_verified: true, // Assume users in profiles table are verified
        name: profile.full_name || email.split('@')[0],
        nickname: profile.full_name?.split(' ')[0] || email.split('@')[0],
        picture: profile.avatar_url,
        
        // Store additional metadata
        user_metadata: {
          affiliation: profile.affiliation,
          orcid: profile.orcid,
          bio: profile.bio,
          expertise: profile.expertise,
          h_index: profile.h_index,
          supabase_id: profile.id,
          migration_source: 'supabase'
        },
        
        // App-specific metadata
        app_metadata: {
          role: profile.role || 'author',
          supabase_id: profile.id,
          permissions: getRolePermissions(profile.role || 'author'),
          account_created: profile.created_at
        }
      };

      console.log('User profile fetched successfully for:', email);
      return callback(null, userProfile);
    })
    .catch(err => {
      console.error('Error fetching user profile:', err);
      return callback(new Error('Database query error'));
    });
}

// Helper function to map roles to permissions
function getRolePermissions(role) {
  const permissions = {
    author: [
      'manuscripts:create',
      'manuscripts:read:own',
      'manuscripts:update:own',
      'manuscripts:delete:draft',
      'reviews:read:own',
      'profile:update:own'
    ],
    editor: [
      'manuscripts:read:all',
      'manuscripts:update:editorial',
      'manuscripts:assign',
      'reviews:read:all',
      'reviews:assign',
      'decisions:create',
      'analytics:read:editorial'
    ],
    reviewer: [
      'manuscripts:read:assigned',
      'reviews:create',
      'reviews:update:own',
      'reviews:read:own'
    ],
    admin: ['*:*']
  };
  
  return permissions[role] || permissions.author;
}