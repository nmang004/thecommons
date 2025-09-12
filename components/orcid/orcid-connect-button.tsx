'use client';

/**
 * ORCID Connect Button Component
 * Official ORCID-styled button for connecting ORCID accounts
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrcidConnectButtonProps {
  onConnect?: () => void;
  redirectTo?: string;
  scope?: string;
  disabled?: boolean;
  variant?: 'default' | 'small' | 'icon';
  className?: string;
}

export function OrcidConnectButton({
  onConnect,
  redirectTo,
  scope = '/authenticate',
  disabled = false,
  variant = 'default',
  className
}: OrcidConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      if (onConnect) {
        onConnect();
        return;
      }

      // Default behavior: redirect to ORCID OAuth
      const params = new URLSearchParams();
      if (redirectTo) params.set('redirect_to', redirectTo);
      if (scope) params.set('scope', scope);

      const authUrl = `/api/orcid/auth?${params.toString()}`;
      window.location.href = authUrl;

    } catch (err) {
      console.error('Error initiating ORCID connection:', err);
      setError('Failed to connect to ORCID. Please try again.');
      setIsLoading(false);
    }
  };

  // ORCID official brand colors
  const orcidGreen = '#A6CE39';
  const orcidStyle = {
    backgroundColor: orcidGreen,
    color: 'white',
    border: `2px solid ${orcidGreen}`,
  };

  if (variant === 'icon') {
    return (
      <Button
        onClick={handleConnect}
        disabled={disabled || isLoading}
        className={cn(
          'w-10 h-10 p-0 rounded-full transition-all duration-200',
          className
        )}
        style={orcidStyle}
        title="Connect ORCID iD"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <OrcidIcon className="w-5 h-5" />
        )}
      </Button>
    );
  }

  if (variant === 'small') {
    return (
      <Button
        onClick={handleConnect}
        disabled={disabled || isLoading}
        size="sm"
        className={cn(
          'text-white font-semibold transition-all duration-200 hover:shadow-md',
          className
        )}
        style={orcidStyle}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <OrcidIcon className="w-4 h-4 mr-2" />
            Connect ORCID
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleConnect}
        disabled={disabled || isLoading}
        size="lg"
        className={cn(
          'text-white font-semibold px-6 py-3 transition-all duration-200 hover:shadow-lg',
          className
        )}
        style={orcidStyle}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            Connecting to ORCID...
          </>
        ) : (
          <>
            <OrcidIcon className="w-5 h-5 mr-3" />
            Connect your ORCID iD
            <ExternalLink className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Connection Failed</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>
          By connecting your ORCID iD, you agree to share your public profile 
          information with The Commons.
        </p>
        <p className="flex items-center space-x-1">
          <Shield className="w-3 h-3" />
          <span>Your ORCID credentials remain secure and private.</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Official ORCID iD icon component
 */
function OrcidIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947 0 .525-.422.947-.947.947-.525 0-.947-.422-.947-.947 0-.516.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.344 5.016h-3.9V7.416zm1.444 1.303v7.444h2.297c2.359 0 3.9-1.303 3.9-3.722 0-2.359-1.541-3.722-3.9-3.722h-2.297z"/>
    </svg>
  );
}

/**
 * ORCID Connect Card Component
 * A more detailed card-style connector with information
 */
interface OrcidConnectCardProps extends OrcidConnectButtonProps {
  title?: string;
  description?: string;
  benefits?: string[];
}

export function OrcidConnectCard({
  title = "Connect Your ORCID iD",
  description = "Link your ORCID iD to verify your identity and streamline the publication process.",
  benefits = [
    "Verify your academic identity",
    "Auto-fill author information",
    "Track your publications automatically",
    "Connect with the global research community"
  ],
  ...buttonProps
}: OrcidConnectCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <OrcidIcon className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Benefits:</h4>
            <ul className="space-y-1">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2">
            <OrcidConnectButton {...buttonProps} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Learn More About ORCID Link
 */
export function LearnMoreOrcidLink() {
  return (
    <div className="text-sm text-gray-500">
      <span>Don't have an ORCID iD? </span>
      <a
        href="https://orcid.org/register"
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-600 hover:text-green-700 underline inline-flex items-center"
      >
        Create one for free
        <ExternalLink className="w-3 h-3 ml-1" />
      </a>
      <span> or </span>
      <a
        href="https://info.orcid.org/what-is-orcid/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-700 underline inline-flex items-center"
      >
        learn more about ORCID
        <ExternalLink className="w-3 h-3 ml-1" />
      </a>
    </div>
  );
}