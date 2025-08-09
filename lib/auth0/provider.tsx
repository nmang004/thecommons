'use client'

import { Auth0Provider as Auth0UserProvider } from '@auth0/nextjs-auth0'
import { ReactNode } from 'react'

interface Auth0ProviderProps {
  children: ReactNode
}

export function Auth0Provider({ children }: Auth0ProviderProps) {
  return (
    <Auth0UserProvider>
      {children}
    </Auth0UserProvider>
  )
}