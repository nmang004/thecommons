/**
 * Auth0 Custom Database - Login Script
 * This script validates user credentials against Supabase during the migration period
 * Place this in the "Login" tab of your Auth0 Custom Database configuration
 */

function login(email, password, callback) {
  // Import Supabase client library (available in Auth0's Node.js environment)
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

  // Attempt to authenticate user with Supabase
  supabase.auth.signInWithPassword({ email, password })
    .then(({ data, error }) => {
      if (error || !data.user) {
        // Invalid credentials
        console.log('Supabase authentication failed:', error?.message);
        return callback(new WrongUsernameOrPasswordError(email));
      }

      // Fetch additional user profile data
      return supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile, error: profileError }) => {
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            // Still allow login but with limited profile data
          }

          // Construct user profile for Auth0
          const userProfile = {
            user_id: data.user.id,
            email: data.user.email,
            email_verified: !!data.user.email_confirmed_at,
            name: profile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
            nickname: profile?.full_name?.split(' ')[0] || email.split('@')[0],
            picture: profile?.avatar_url || data.user.user_metadata?.avatar_url,
            
            // Store additional metadata
            user_metadata: {
              affiliation: profile?.affiliation,
              orcid: profile?.orcid,
              bio: profile?.bio,
              expertise: profile?.expertise,
              h_index: profile?.h_index,
              supabase_id: data.user.id, // Keep reference to original ID
              migration_source: 'supabase',
              last_login: new Date().toISOString()
            },
            
            // App-specific metadata
            app_metadata: {
              role: profile?.role || 'author',
              supabase_id: data.user.id,
              migrated_at: new Date().toISOString(),
              permissions: getRolePermissions(profile?.role || 'author')
            }
          };

          console.log('Supabase login successful for:', email);
          return callback(null, userProfile);
        });
    })
    .catch(err => {
      console.error('Unexpected error during login:', err);
      return callback(new Error('Authentication service error'));
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
    admin: ['*:*'] // Admin has all permissions
  };
  
  return permissions[role] || permissions.author;
}