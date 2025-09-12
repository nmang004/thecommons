'use client';

/**
 * ORCID Profile Badge Component
 * Shows ORCID verification status and provides quick access to ORCID profile
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  X,
  Settings,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrcidConnectionStatus } from '@/lib/orcid/types';

interface OrcidProfileBadgeProps {
  orcidId?: string;
  isVerified?: boolean;
  status?: OrcidConnectionStatus;
  lastSyncAt?: Date;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  onSync?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

export function OrcidProfileBadge({
  orcidId,
  isVerified = false,
  status,
  lastSyncAt,
  showActions = true,
  variant = 'default',
  onSync,
  onDisconnect,
  className
}: OrcidProfileBadgeProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Format ORCID iD for display (with dashes)
  const formatOrcidId = (id: string) => {
    if (id.includes('-')) return id;
    return id.replace(/(.{4})(.{4})(.{4})(.{4})/, '$1-$2-$3-$4');
  };

  const formattedOrcidId = orcidId ? formatOrcidId(orcidId) : null;

  // Handle sync action
  const handleSync = async () => {
    if (!onSync) return;
    
    setIsLoading(true);
    try {
      await onSync();
    } finally {
      setIsLoading(false);
    }
  };

  // Get ORCID profile URL
  const getOrcidUrl = () => {
    if (!orcidId) return '#';
    return `https://orcid.org/${formattedOrcidId}`;
  };

  // Compact variant - minimal badge
  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center', className)}>
        {isVerified && orcidId ? (
          <a
            href={getOrcidUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
            title="View ORCID profile"
          >
            <OrcidIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{formattedOrcidId}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="inline-flex items-center space-x-1 text-gray-400">
            <OrcidIcon className="w-4 h-4" />
            <span className="text-sm">No ORCID</span>
          </span>
        )}
      </div>
    );
  }

  // Detailed variant - comprehensive status display
  if (variant === 'detailed') {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-4 space-y-3', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <OrcidIcon className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">ORCID Integration</span>
          </div>
          
          {isVerified && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {/* ORCID ID Display */}
        {isVerified && orcidId ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <a
                href={getOrcidUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span className="font-mono text-sm">{formattedOrcidId}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              
              {showActions && (
                <div className="flex items-center space-x-1">
                  {onSync && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSync}
                      disabled={isLoading}
                      className="text-gray-500 hover:text-gray-700"
                      title="Sync ORCID data"
                    >
                      <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                    </Button>
                  )}
                  
                  {onDisconnect && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDisconnect}
                      className="text-red-500 hover:text-red-700"
                      title="Disconnect ORCID"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Last Sync Info */}
            {lastSyncAt && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>Last synced: {formatLastSync(lastSyncAt)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            <p>No ORCID iD connected</p>
          </div>
        )}

        {/* Connection Status */}
        {status && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                status.hasValidToken ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span className="text-sm text-gray-600">
                {status.hasValidToken ? 'Connected' : 'Connection expired'}
              </span>
            </div>

            {status.needsReauth && (
              <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 p-2 rounded-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Reconnection required</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('inline-flex items-center space-x-2', className)}>
      {isVerified && orcidId ? (
        <>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            ORCID Verified
          </Badge>
          
          <a
            href={getOrcidUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors font-mono text-sm"
            title="View ORCID profile"
          >
            <span>{formattedOrcidId}</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {showActions && (onSync || onDisconnect) && (
            <div className="flex items-center space-x-1">
              {onSync && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSync}
                  disabled={isLoading}
                  className="text-gray-500 hover:text-gray-700 px-2"
                  title="Sync ORCID data"
                >
                  <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                </Button>
              )}
              
              {onDisconnect && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDisconnect}
                  className="text-red-500 hover:text-red-700 px-2"
                  title="Disconnect ORCID"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Verified
        </Badge>
      )}
    </div>
  );
}

/**
 * ORCID Icon Component
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
 * Sync Status Indicator Component
 */
interface SyncStatusProps {
  lastSyncAt?: Date;
  isLoading?: boolean;
  error?: string;
}

export function OrcidSyncStatus({ lastSyncAt, isLoading, error }: SyncStatusProps) {
  if (isLoading) {
    return (
      <div className="inline-flex items-center space-x-2 text-blue-600">
        <RotateCcw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Syncing...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inline-flex items-center space-x-2 text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Sync failed</span>
      </div>
    );
  }

  if (lastSyncAt) {
    return (
      <div className="inline-flex items-center space-x-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Synced {formatLastSync(lastSyncAt)}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-2 text-gray-500">
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm">Never synced</span>
    </div>
  );
}

/**
 * Helper function to format last sync time
 */
function formatLastSync(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * ORCID Connection Card with status
 */
interface OrcidConnectionCardProps {
  status?: OrcidConnectionStatus;
  onSync?: () => void;
  onDisconnect?: () => void;
  onConnect?: () => void;
  className?: string;
}

export function OrcidConnectionCard({
  status,
  onSync,
  onDisconnect,
  onConnect,
  className
}: OrcidConnectionCardProps) {
  if (!status?.isConnected) {
    return (
      <div className={cn('bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200', className)}>
        <div className="text-center space-y-3">
          <OrcidIcon className="w-8 h-8 text-gray-400 mx-auto" />
          <div>
            <h3 className="font-medium text-gray-900">Connect Your ORCID iD</h3>
            <p className="text-sm text-gray-600">
              Verify your academic identity and streamline your profile
            </p>
          </div>
          {onConnect && (
            <Button onClick={onConnect} className="bg-[#A6CE39] hover:bg-[#8AB833] text-white">
              <OrcidIcon className="w-4 h-4 mr-2" />
              Connect ORCID
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <OrcidProfileBadge
        orcidId={status.orcidId}
        isVerified={status.isConnected}
        status={status}
        lastSyncAt={status.lastSyncAt}
        variant="detailed"
        onSync={onSync}
        onDisconnect={onDisconnect}
      />
    </div>
  );
}