import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SystemMonitoring } from '@/components/admin/system-monitoring'

export const metadata: Metadata = {
  title: 'System Management - Admin Dashboard',
  description: 'Monitor system health, logs, and configuration settings.',
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }
  
  return { user, profile }
}

// Mock function to simulate system health checks
async function getSystemHealth() {
  // In a real application, these would be actual health checks
  return {
    database: {
      status: 'operational' as const,
      responseTime: 45,
      lastChecked: new Date().toISOString(),
      uptime: 99.9
    },
    api: {
      status: 'operational' as const,
      responseTime: 120,
      lastChecked: new Date().toISOString(),
      uptime: 99.8
    },
    storage: {
      status: 'operational' as const,
      responseTime: 75,
      lastChecked: new Date().toISOString(),
      uptime: 99.95,
      usage: 67
    },
    email: {
      status: 'degraded' as const,
      responseTime: 1200,
      lastChecked: new Date().toISOString(),
      uptime: 98.5,
      queueSize: 142
    },
    search: {
      status: 'operational' as const,
      responseTime: 200,
      lastChecked: new Date().toISOString(),
      uptime: 99.7
    },
    cdn: {
      status: 'operational' as const,
      responseTime: 35,
      lastChecked: new Date().toISOString(),
      uptime: 99.99
    }
  }
}

// Mock function to get system metrics
async function getSystemMetrics() {
  return {
    server: {
      cpu: 45,
      memory: 72,
      disk: 34,
      network: 23
    },
    database: {
      connections: 47,
      maxConnections: 100,
      queriesPerSecond: 156,
      slowQueries: 3
    },
    performance: {
      avgResponseTime: 245,
      requestsPerMinute: 1847,
      errorRate: 0.02,
      availability: 99.85
    }
  }
}

// Mock function to get recent system logs
async function getSystemLogs() {
  const now = new Date()
  return [
    {
      id: '1',
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      level: 'info' as const,
      service: 'api',
      message: 'User authentication successful for user@example.com',
      details: { userId: 'user123', ip: '192.168.1.100' }
    },
    {
      id: '2',
      timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
      level: 'warning' as const,
      service: 'email',
      message: 'Email delivery delayed - queue size exceeded threshold',
      details: { queueSize: 150, threshold: 100 }
    },
    {
      id: '3',
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
      level: 'error' as const,
      service: 'storage',
      message: 'File upload failed for manuscript submission',
      details: { fileId: 'file456', error: 'Network timeout' }
    },
    {
      id: '4',
      timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
      level: 'info' as const,
      service: 'database',
      message: 'Database backup completed successfully',
      details: { backupSize: '2.4GB', duration: '12 minutes' }
    },
    {
      id: '5',
      timestamp: new Date(now.getTime() - 60 * 60000).toISOString(),
      level: 'info' as const,
      service: 'api',
      message: 'Manuscript submission received and processed',
      details: { manuscriptId: 'ms789', authorId: 'author456' }
    }
  ]
}

export default async function AdminSystemPage() {
  await getAuthenticatedUser()
  
  const [systemHealth, systemMetrics, systemLogs] = await Promise.all([
    getSystemHealth(),
    getSystemMetrics(),
    getSystemLogs()
  ])

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
          System Management
        </h1>
        <p className="text-lg text-muted-foreground">
          Monitor system health, performance metrics, and operational logs
        </p>
      </div>

      {/* System Monitoring Component */}
      <SystemMonitoring 
        systemHealth={systemHealth}
        systemMetrics={systemMetrics}
        systemLogs={systemLogs}
      />
    </div>
  )
}