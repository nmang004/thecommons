"use client"

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SearchBar } from '@/components/ui/search-bar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TablePagination,
} from '@/components/ui/table'
import { 
  Server,
  Database,
  Cloud,
  Mail,
  Search,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Settings,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  MemoryStick
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ServiceHealth {
  status: 'operational' | 'degraded' | 'outage'
  responseTime: number
  lastChecked: string
  uptime: number
  usage?: number
  queueSize?: number
}

interface SystemHealth {
  database: ServiceHealth
  api: ServiceHealth
  storage: ServiceHealth
  email: ServiceHealth
  search: ServiceHealth
  cdn: ServiceHealth
}

interface SystemMetrics {
  server: {
    cpu: number
    memory: number
    disk: number
    network: number
  }
  database: {
    connections: number
    maxConnections: number
    queriesPerSecond: number
    slowQueries: number
  }
  performance: {
    avgResponseTime: number
    requestsPerMinute: number
    errorRate: number
    availability: number
  }
}

interface SystemLog {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error'
  service: string
  message: string
  details?: Record<string, any>
}

interface SystemMonitoringProps {
  systemHealth: SystemHealth
  systemMetrics: SystemMetrics
  systemLogs: SystemLog[]
}

const statusColors = {
  operational: 'bg-green-100 text-green-800',
  degraded: 'bg-yellow-100 text-yellow-800',
  outage: 'bg-red-100 text-red-800'
}

const statusIcons = {
  operational: <CheckCircle className="h-4 w-4" />,
  degraded: <AlertTriangle className="h-4 w-4" />,
  outage: <XCircle className="h-4 w-4" />
}

const logLevelColors = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800'
}

const serviceIcons = {
  database: <Database className="h-5 w-5" />,
  api: <Server className="h-5 w-5" />,
  storage: <HardDrive className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  search: <Search className="h-5 w-5" />,
  cdn: <Cloud className="h-5 w-5" />
}

export function SystemMonitoring({ systemHealth, systemMetrics, systemLogs }: SystemMonitoringProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // Filter logs
  const filteredLogs = useMemo(() => {
    return systemLogs.filter((log) => {
      const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           log.service.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter
      const matchesService = serviceFilter === 'all' || log.service === serviceFilter
      
      return matchesSearch && matchesLevel && matchesService
    })
  }, [systemLogs, searchQuery, logLevelFilter, serviceFilter])

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize)
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const getUniqueServices = () => {
    const services = systemLogs.map(log => log.service).filter(Boolean)
    return Array.from(new Set(services)).sort()
  }

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  const refreshData = () => {
    // TODO: Implement data refresh
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-heading font-bold text-green-600 mb-1">
                {systemMetrics.performance.availability}%
              </div>
              <div className="text-sm text-muted-foreground">System Availability</div>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-heading font-bold text-blue-600 mb-1">
                {systemMetrics.performance.avgResponseTime}ms
              </div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <Zap className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-heading font-bold text-purple-600 mb-1">
                {systemMetrics.performance.requestsPerMinute.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Requests/Min</div>
            </div>
            <Server className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-heading font-bold text-red-600 mb-1">
                {(systemMetrics.performance.errorRate * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="services">Service Health</TabsTrigger>
            <TabsTrigger value="metrics">System Metrics</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Service Health Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(systemHealth).map(([service, health]) => (
              <Card key={service} className="card-academic p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {serviceIcons[service as keyof typeof serviceIcons]}
                    <span className="font-heading font-semibold capitalize">{service}</span>
                  </div>
                  <Badge className={getStatusColor(health.status)} variant="secondary">
                    {statusIcons[health.status as keyof typeof statusIcons]}
                    <span className="ml-1 capitalize">{health.status}</span>
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Response Time</span>
                    <span className="font-medium">{health.responseTime}ms</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-medium">{formatUptime(health.uptime)}</span>
                  </div>
                  
                  {health.usage !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Usage</span>
                        <span className="font-medium">{health.usage}%</span>
                      </div>
                      <Progress value={health.usage} className="h-2" />
                    </div>
                  )}
                  
                  {health.queueSize !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Queue Size</span>
                      <span className="font-medium">{health.queueSize}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    Last checked: {formatTimestamp(health.lastChecked)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* System Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Server Resources */}
            <Card className="card-academic p-6">
              <h3 className="font-heading font-semibold mb-4 flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Server Resources
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <Cpu className="h-4 w-4 mr-2" />
                      CPU Usage
                    </span>
                    <span className="font-medium">{systemMetrics.server.cpu}%</span>
                  </div>
                  <Progress value={systemMetrics.server.cpu} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <MemoryStick className="h-4 w-4 mr-2" />
                      Memory Usage
                    </span>
                    <span className="font-medium">{systemMetrics.server.memory}%</span>
                  </div>
                  <Progress value={systemMetrics.server.memory} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <HardDrive className="h-4 w-4 mr-2" />
                      Disk Usage
                    </span>
                    <span className="font-medium">{systemMetrics.server.disk}%</span>
                  </div>
                  <Progress value={systemMetrics.server.disk} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <Wifi className="h-4 w-4 mr-2" />
                      Network I/O
                    </span>
                    <span className="font-medium">{systemMetrics.server.network}%</span>
                  </div>
                  <Progress value={systemMetrics.server.network} className="h-2" />
                </div>
              </div>
            </Card>

            {/* Database Metrics */}
            <Card className="card-academic p-6">
              <h3 className="font-heading font-semibold mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Database Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Connections</span>
                  <span className="font-medium">
                    {systemMetrics.database.connections}/{systemMetrics.database.maxConnections}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Connection Usage</span>
                    <span className="font-medium">
                      {((systemMetrics.database.connections / systemMetrics.database.maxConnections) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={(systemMetrics.database.connections / systemMetrics.database.maxConnections) * 100} 
                    className="h-2" 
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Queries/Second</span>
                  <span className="font-medium">{systemMetrics.database.queriesPerSecond}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Slow Queries</span>
                  <span className="font-medium text-yellow-600">{systemMetrics.database.slowQueries}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card className="card-academic">
            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-heading font-semibold">System Logs</h3>
                  <Badge variant="secondary">{filteredLogs.length} entries</Badge>
                </div>
              </div>
            </div>

            <div className="p-6 border-b bg-muted/30">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search logs by message or service..."
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {getUniqueServices().map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge className={logLevelColors[log.level]} variant="secondary">
                          {log.level.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.service}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate">{log.message}</div>
                        {log.details && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <code className="bg-muted px-1 py-0.5 rounded text-xs">
                              {JSON.stringify(log.details)}
                            </code>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card className="card-academic p-6 text-center">
            <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-heading font-semibold mb-2">System Configuration</h3>
            <p className="text-muted-foreground mb-4">
              Advanced system configuration and settings management.
            </p>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Access Configuration
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}