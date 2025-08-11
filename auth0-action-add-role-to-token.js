/**
 * Auth0 Action: Add Role to Token
 * 
 * This action adds the user's role and permissions from app_metadata
 * to the ID token as custom claims, making them available to the front-end application.
 * 
 * To use this action:
 * 1. Navigate to Actions > Library in your Auth0 Dashboard
 * 2. Click "Build Custom"
 * 3. Name the action "Add Role to Token"
 * 4. Set trigger as "Login / Post Login"
 * 5. Copy this code into the editor
 * 6. Click "Deploy"
 * 7. Go to Actions > Flows > Login and drag this action into the flow
 * 8. Click "Apply"
 */

/**
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Use a unique namespace for custom claims (must be a valid URL format)
  const namespace = 'https://thecommons.institute/';
  
  // Get user's app_metadata
  const appMetadata = event.user.app_metadata || {};
  
  // Add role to token (default to 'author' if not set)
  const userRole = appMetadata.role || 'author';
  api.idToken.setCustomClaim(`${namespace}role`, userRole);
  
  // Add permissions to token if they exist
  if (appMetadata.permissions && Array.isArray(appMetadata.permissions)) {
    api.idToken.setCustomClaim(`${namespace}permissions`, appMetadata.permissions);
  } else {
    // Set default permissions based on role
    const defaultPermissions = getDefaultPermissions(userRole);
    api.idToken.setCustomClaim(`${namespace}permissions`, defaultPermissions);
  }
  
  // Add user metadata to token for profile information
  const userMetadata = event.user.user_metadata || {};
  if (Object.keys(userMetadata).length > 0) {
    api.idToken.setCustomClaim(`${namespace}metadata`, userMetadata);
  }
};

/**
 * Helper function to get default permissions based on user role
 */
function getDefaultPermissions(role) {
  switch (role) {
    case 'admin':
      return ['*:*']; // Admin has all permissions
    case 'editor':
      return [
        'manuscripts:read',
        'manuscripts:edit',
        'reviews:read',
        'reviews:assign',
        'decisions:make',
        'analytics:view'
      ];
    case 'reviewer':
      return [
        'manuscripts:read',
        'reviews:create',
        'reviews:edit',
        'reviews:read'
      ];
    case 'author':
    default:
      return [
        'manuscripts:create',
        'manuscripts:edit',
        'manuscripts:read',
        'submissions:manage'
      ];
  }
}