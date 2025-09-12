'use client';

/**
 * ORCID Sync Manager Component
 * Provides interface for syncing data between ORCID and local profile
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Settings,
  Clock,
  BookOpen,
  Briefcase,
  GraduationCap,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrcidSyncOptions, OrcidSyncResult } from '@/lib/orcid/types';

interface OrcidSyncManagerProps {
  onSync?: (options: OrcidSyncOptions) => Promise<{
    success: boolean;
    results?: OrcidSyncResult[];
    error?: string;
  }>;
  className?: string;
}

export function OrcidSyncManager({ onSync, className }: OrcidSyncManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<OrcidSyncResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync options state
  const [syncOptions, setSyncOptions] = useState<OrcidSyncOptions>({
    syncProfile: true,
    syncWorks: true,
    syncEmployments: true,
    syncEducations: true,
    overwriteLocal: false,
    dryRun: false
  });

  const handleSync = async (dryRun = false) => {
    if (!onSync) return;

    setIsLoading(true);
    setError(null);
    setResults(null);
    setProgress(0);

    try {
      const options = {
        ...syncOptions,
        dryRun
      };

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await onSync(options);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setResults(result.results || []);
      } else {
        setError(result.error || 'Sync failed');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const handlePreview = () => {
    setIsDryRun(true);
    handleSync(true);
  };

  const handleActualSync = () => {
    setIsDryRun(false);
    handleSync(false);
  };

  const updateSyncOption = (key: keyof OrcidSyncOptions, value: boolean) => {
    setSyncOptions(prev => ({ ...prev, [key]: value }));
  };

  const getTotalItemsToSync = () => {
    return results?.reduce((total, result) => total + result.itemsSynced, 0) || 0;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Sync Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Sync Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Import from ORCID</span>
              </h4>
              
              <div className="space-y-2 ml-6">
                <label className="flex items-center space-x-3">
                  <Checkbox
                    checked={syncOptions.syncProfile}
                    onCheckedChange={(checked) => 
                      updateSyncOption('syncProfile', checked as boolean)
                    }
                  />
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Profile information</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <Checkbox
                    checked={syncOptions.syncWorks}
                    onCheckedChange={(checked) => 
                      updateSyncOption('syncWorks', checked as boolean)
                    }
                  />
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Publications & works</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <Checkbox
                    checked={syncOptions.syncEmployments}
                    onCheckedChange={(checked) => 
                      updateSyncOption('syncEmployments', checked as boolean)
                    }
                  />
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Employment history</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <Checkbox
                    checked={syncOptions.syncEducations}
                    onCheckedChange={(checked) => 
                      updateSyncOption('syncEducations', checked as boolean)
                    }
                  />
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Education history</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Advanced Options</h4>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <Checkbox
                    checked={syncOptions.overwriteLocal}
                    onCheckedChange={(checked) => 
                      updateSyncOption('overwriteLocal', checked as boolean)
                    }
                  />
                  <span className="text-sm">Overwrite existing local data</span>
                </label>

                <p className="text-xs text-gray-500 ml-6">
                  If unchecked, only empty fields will be updated
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handlePreview}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Changes
            </Button>

            <Button
              onClick={handleActualSync}
              disabled={isLoading || (!results && !isDryRun)}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">
                Syncing data with ORCID...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Sync Failed</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {results && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {isDryRun ? 'Preview Results' : 'Sync Results'}
              </span>
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                {getTotalItemsToSync()} item{getTotalItemsToSync() !== 1 ? 's' : ''} 
                {isDryRun ? ' would be synced' : ' synced'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <SyncResultItem
                  key={index}
                  result={result}
                  isDryRun={isDryRun}
                />
              ))}

              {isDryRun && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    This is a preview. No changes have been made to your profile.
                    Click "Sync Now" to apply these changes.
                  </p>
                  <Button
                    onClick={handleActualSync}
                    disabled={isLoading}
                    size="sm"
                  >
                    Apply Changes
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="text-sm text-gray-500 space-y-2">
        <h4 className="font-medium text-gray-700">How sync works:</h4>
        <ul className="space-y-1 ml-4">
          <li className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
            <span>Data is imported from your public ORCID profile</span>
          </li>
          <li className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
            <span>Your ORCID data remains unchanged</span>
          </li>
          <li className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
            <span>Use "Preview Changes" to see what would be updated</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Individual sync result item component
 */
interface SyncResultItemProps {
  result: OrcidSyncResult;
  isDryRun: boolean;
}

function SyncResultItem({ result, isDryRun }: SyncResultItemProps) {
  const getIcon = (syncType: string) => {
    switch (syncType) {
      case 'profile': return <User className="w-4 h-4" />;
      case 'publications': 
      case 'works': return <BookOpen className="w-4 h-4" />;
      case 'affiliations':
      case 'employments': return <Briefcase className="w-4 h-4" />;
      case 'education': return <GraduationCap className="w-4 h-4" />;
      default: return <RefreshCw className="w-4 h-4" />;
    }
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> :
      <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 mt-0.5">
        {getIcon(result.syncType)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 capitalize">
            {result.syncType === 'works' ? 'Publications' : result.syncType}
          </h4>
          
          <div className="flex items-center space-x-2">
            <span className={cn('text-sm font-medium', getStatusColor(result.success))}>
              {result.itemsSynced} {isDryRun ? 'to sync' : 'synced'}
            </span>
            {getStatusIcon(result.success)}
          </div>
        </div>

        {result.errors && result.errors.length > 0 && (
          <div className="mt-2 space-y-1">
            {result.errors.map((error, index) => (
              <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            ))}
          </div>
        )}

        {result.warnings && result.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {result.warnings.map((warning, index) => (
              <p key={index} className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                {warning}
              </p>
            ))}
          </div>
        )}

        {result.data && isDryRun && (
          <div className="mt-2 text-xs text-gray-600">
            <details>
              <summary className="cursor-pointer hover:text-gray-800">
                Preview data changes
              </summary>
              <pre className="mt-2 p-2 bg-white rounded border overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Last sync indicator component
 */
interface LastSyncIndicatorProps {
  lastSyncAt?: Date;
  className?: string;
}

export function LastSyncIndicator({ lastSyncAt, className }: LastSyncIndicatorProps) {
  if (!lastSyncAt) {
    return (
      <div className={cn('flex items-center space-x-2 text-gray-500', className)}>
        <Clock className="w-4 h-4" />
        <span className="text-sm">Never synced</span>
      </div>
    );
  }

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={cn('flex items-center space-x-2 text-gray-600', className)}>
      <Clock className="w-4 h-4" />
      <span className="text-sm">Last synced {formatLastSync(lastSyncAt)}</span>
    </div>
  );
}