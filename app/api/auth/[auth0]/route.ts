import { handleAuth, handleCallback, handleLogin, handleLogout } from '@auth0/nextjs-auth0'
import { NextRequest } from 'next/server'

// Custom after callback to sync user with database
const afterCallback = async (req: NextRequest, session: any) => {
  try {
    // Only sync on first login or if user doesn't exist in our database
    const response = await fetch(`${process.env.AUTH0_BASE_URL}/api/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth0Id: session.user.sub,
        email: session.user.email,
        name: session.user.name,
        emailVerified: session.user.email_verified,
        picture: session.user.picture,
        metadata: session.user.user_metadata || {},
        appMetadata: session.user.app_metadata || {}
      })
    })

    if (!response.ok) {
      console.error('Failed to sync user with database:', await response.text())
      // Don't fail the login process, just log the error
    }

    return session
  } catch (error) {
    console.error('Error in afterCallback:', error)
    // Return session anyway to not break the login flow
    return session
  }
}

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: process.env.AUTH0_SCOPE
    }
  }),
  callback: handleCallback({
    afterCallback
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL
  })
})