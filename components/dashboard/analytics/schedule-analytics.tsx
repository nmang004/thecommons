'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { 
  Calendar, Clock, CheckCircle, AlertTriangle, Target,
  TrendingUp, TrendingDown, Eye, Download,
  BookOpen, FileText, Users, Zap, CalendarDays
} from 'lucide-react'

interface Publication {
  id: string
  title: string
  volume: number
  issue: number
  plannedDate: string
  actualDate?: string
  status: 'planning' | 'in_production' | 'published' | 'delayed'
  manuscriptCount: number
  targetPages: number
  actualPages?: number
  editorAssigned: string
  deadlines: {
    manuscriptDeadline: string
    copyEditDeadline: string
    proofDeadline: string
    publicationDate: string
  }
}

interface DeadlineTracker {
  type: 'manuscript' | 'copyedit' | 'proof' | 'publication'
  title: string
  deadline: string
  status: 'upcoming' | 'due_today' | 'overdue' | 'completed'
  daysRemaining: number
  assignee: string
  priority: 'high' | 'medium' | 'low'
}

interface ProductionMetrics {
  totalIssues: number
  publishedOnTime: number
  averageDelay: number
  manuscriptsInPipeline: number
  upcomingDeadlines: number
  overdueItems: number
}

interface WorkloadTimeline {
  month: string
  manuscriptDeadlines: number
  copyEditTasks: number
  proofTasks: number
  publications: number
}

function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  description,
  loading = false 
}: {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  description?: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <Skeleton className="h-8 w-32 mt-2" />
        <Skeleton className="h-3 w-48 mt-2" />
      </Card>
    )
  }

  const changeColor = changeType === 'increase' ? 'text-green-600' : 
                      changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
  const ChangeIcon = changeType === 'increase' ? TrendingUp : 
                     changeType === 'decrease' ? TrendingDown : null

  return (
    <Card className="p-6 card-academic">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center space-x-1 ${changeColor} text-xs`}>
                {ChangeIcon && <ChangeIcon className="h-3 w-3" />}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  )
}

export function ScheduleAnalytics() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [deadlines, setDeadlines] = useState<DeadlineTracker[]>([])
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null)
  const [workloadTimeline, setWorkloadTimeline] = useState<WorkloadTimeline[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar')

  useEffect(() => {
    loadScheduleData()
  }, [selectedYear])

  const loadScheduleData = async () => {
    try {
      setLoading(true)
      
      // Generate sample publication data
      const samplePublications: Publication[] = [
        {
          id: 'pub-001',
          title: 'The Commons - Volume 12, Issue 1',
          volume: 12,
          issue: 1,
          plannedDate: '2024-03-15',
          actualDate: '2024-03-18',
          status: 'published',
          manuscriptCount: 8,
          targetPages: 120,
          actualPages: 125,
          editorAssigned: 'Dr. Sarah Johnson',
          deadlines: {
            manuscriptDeadline: '2024-01-15',
            copyEditDeadline: '2024-02-15',
            proofDeadline: '2024-03-01',
            publicationDate: '2024-03-15'
          }
        },
        {
          id: 'pub-002',
          title: 'The Commons - Volume 12, Issue 2',
          volume: 12,
          issue: 2,
          plannedDate: '2024-06-15',
          status: 'in_production',
          manuscriptCount: 10,
          targetPages: 140,
          editorAssigned: 'Prof. Michael Chen',
          deadlines: {
            manuscriptDeadline: '2024-04-15',
            copyEditDeadline: '2024-05-15',
            proofDeadline: '2024-06-01',
            publicationDate: '2024-06-15'
          }
        },
        {
          id: 'pub-003',
          title: 'The Commons - Volume 12, Issue 3',
          volume: 12,
          issue: 3,
          plannedDate: '2024-09-15',
          status: 'planning',
          manuscriptCount: 6,
          targetPages: 100,
          editorAssigned: 'Dr. Emily Rodriguez',
          deadlines: {
            manuscriptDeadline: '2024-07-15',
            copyEditDeadline: '2024-08-15',
            proofDeadline: '2024-09-01',
            publicationDate: '2024-09-15'
          }
        },
        {
          id: 'pub-004',
          title: 'The Commons - Volume 12, Issue 4',
          volume: 12,
          issue: 4,
          plannedDate: '2024-12-15',
          status: 'planning',
          manuscriptCount: 4,
          targetPages: 90,
          editorAssigned: 'Dr. James Williams',
          deadlines: {
            manuscriptDeadline: '2024-10-15',
            copyEditDeadline: '2024-11-15',
            proofDeadline: '2024-12-01',
            publicationDate: '2024-12-15'
          }
        },
        {
          id: 'pub-005',
          title: 'Special Issue: AI in Academic Publishing',
          volume: 12,
          issue: 5,
          plannedDate: '2024-08-30',
          status: 'delayed',
          manuscriptCount: 12,
          targetPages: 180,
          editorAssigned: 'Dr. Lisa Anderson',
          deadlines: {
            manuscriptDeadline: '2024-06-30',
            copyEditDeadline: '2024-07-30',
            proofDeadline: '2024-08-15',
            publicationDate: '2024-08-30'
          }
        }
      ]
      
      setPublications(samplePublications)
      
      // Generate deadline tracker data
      const now = new Date()
      const sampleDeadlines: DeadlineTracker[] = [
        {
          type: 'manuscript',
          title: 'Volume 12, Issue 3 - Manuscript Submissions',
          deadline: '2024-07-15',
          status: 'upcoming',
          daysRemaining: Math.ceil((new Date('2024-07-15').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          assignee: 'Dr. Emily Rodriguez',
          priority: 'high'
        },
        {
          type: 'copyedit',
          title: 'Volume 12, Issue 2 - Copy Editing',
          deadline: '2024-05-15',
          status: 'due_today',
          daysRemaining: 0,
          assignee: 'Editorial Team',
          priority: 'high'
        },
        {
          type: 'proof',
          title: 'Volume 12, Issue 2 - Proof Review',
          deadline: '2024-06-01',
          status: 'upcoming',
          daysRemaining: Math.ceil((new Date('2024-06-01').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          assignee: 'Production Team',
          priority: 'medium'
        },
        {
          type: 'publication',
          title: 'Volume 12, Issue 2 - Publication',
          deadline: '2024-06-15',
          status: 'upcoming',
          daysRemaining: Math.ceil((new Date('2024-06-15').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          assignee: 'Dr. Sarah Johnson',
          priority: 'high'
        },
        {
          type: 'copyedit',
          title: 'Special Issue - Copy Editing',
          deadline: '2024-07-30',
          status: 'overdue',
          daysRemaining: Math.ceil((new Date('2024-07-30').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          assignee: 'Editorial Team',
          priority: 'high'
        }
      ]
      
      setDeadlines(sampleDeadlines)
      
      // Calculate metrics
      const publishedOnTime = samplePublications.filter(p => 
        p.status === 'published' && p.actualDate && 
        new Date(p.actualDate) <= new Date(p.plannedDate)
      ).length
      
      const overdueDeadlines = sampleDeadlines.filter(d => d.status === 'overdue').length
      const upcomingDeadlines = sampleDeadlines.filter(d => 
        d.status === 'upcoming' || d.status === 'due_today'
      ).length
      
      const manuscriptsInPipeline = samplePublications
        .filter(p => p.status !== 'published')
        .reduce((sum, p) => sum + p.manuscriptCount, 0)
      
      setMetrics({
        totalIssues: samplePublications.length,
        publishedOnTime,
        averageDelay: 3, // Mock data
        manuscriptsInPipeline,
        upcomingDeadlines,
        overdueItems: overdueDeadlines
      })
      
      // Generate workload timeline (next 12 months)
      const timelineData = []
      for (let i = 0; i < 12; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() + i)
        const month = date.toLocaleString('default', { month: 'short' })
        
        timelineData.push({
          month,
          manuscriptDeadlines: Math.floor(Math.random() * 8) + 2,
          copyEditTasks: Math.floor(Math.random() * 6) + 1,
          proofTasks: Math.floor(Math.random() * 4) + 1,
          publications: Math.floor(Math.random() * 2) + 1
        })
      }
      
      setWorkloadTimeline(timelineData)
      
    } catch (error) {
      console.error('Error loading schedule data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-50 border-green-200'
      case 'in_production': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'planning': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'delayed': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getDeadlineColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'upcoming': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'due_today': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Editorial Schedule</h2>
          <p className="text-muted-foreground mt-1">
            Publication schedule and deadline tracking
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1 text-sm border rounded-md"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
          <Button 
            variant={viewMode === 'calendar' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button 
            variant={viewMode === 'timeline' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Timeline
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Schedule
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Issues Planned"
          value={metrics?.totalIssues || 0}
          change={20}
          changeType="increase"
          icon={<BookOpen className="h-6 w-6 text-blue-600" />}
          description={`${metrics?.publishedOnTime || 0} published on time`}
          loading={loading}
        />
        
        <MetricCard
          title="Manuscripts in Pipeline"
          value={metrics?.manuscriptsInPipeline || 0}
          change={-8}
          changeType="decrease"
          icon={<FileText className="h-6 w-6 text-amber-600" />}
          description="Across all upcoming issues"
          loading={loading}
        />
        
        <MetricCard
          title="Upcoming Deadlines"
          value={metrics?.upcomingDeadlines || 0}
          change={15}
          changeType="increase"
          icon={<Clock className="h-6 w-6 text-green-600" />}
          description="Next 30 days"
          loading={loading}
        />
        
        <MetricCard
          title="Overdue Items"
          value={metrics?.overdueItems || 0}
          change={metrics && metrics.overdueItems > 0 ? 50 : -25}
          changeType={metrics && metrics.overdueItems > 0 ? "increase" : "decrease"}
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          description="Requiring immediate attention"
          loading={loading}
        />
      </div>

      {/* Deadline Alerts */}
      {metrics && metrics.overdueItems > 0 && (
        <Card className="p-6 card-academic border-red-200 bg-red-50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Deadline Alert</h3>
              <p className="text-sm text-red-700 mt-1">
                {metrics.overdueItems} deadline{metrics.overdueItems > 1 ? 's are' : ' is'} overdue. 
                Immediate action required to maintain publication schedule.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Timeline */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Workload Timeline
            </h3>
            <p className="text-sm text-muted-foreground">
              Editorial tasks and deadlines over the next 12 months
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workloadTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar 
                  dataKey="manuscriptDeadlines" 
                  stackId="a" 
                  fill="#1e3a8a"
                  name="Manuscript Deadlines"
                />
                <Bar 
                  dataKey="copyEditTasks" 
                  stackId="a" 
                  fill="#3b82f6"
                  name="Copy Edit Tasks"
                />
                <Bar 
                  dataKey="proofTasks" 
                  stackId="a" 
                  fill="#60a5fa"
                  name="Proof Tasks"
                />
                <Bar 
                  dataKey="publications" 
                  stackId="a" 
                  fill="#93c5fd"
                  name="Publications"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Publication Timeline */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Zap className="h-5 w-5 mr-2 text-green-600" />
              Publication Progress
            </h3>
            <p className="text-sm text-muted-foreground">
              Status of planned publications for {selectedYear}
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-4">
              {publications.map((pub) => (
                <div key={pub.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{pub.title}</h4>
                        <Badge className={getStatusColor(pub.status)} variant="outline">
                          {pub.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{pub.manuscriptCount} manuscripts</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{pub.editorAssigned}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(pub.plannedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            pub.status === 'published' ? 'bg-green-600' :
                            pub.status === 'in_production' ? 'bg-blue-600' :
                            pub.status === 'delayed' ? 'bg-red-600' :
                            'bg-gray-400'
                          }`}
                          style={{ 
                            width: pub.status === 'published' ? '100%' :
                                   pub.status === 'in_production' ? '60%' :
                                   pub.status === 'delayed' ? '40%' : '20%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Deadline Tracker */}
      <Card className="p-6 card-academic">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2 text-amber-600" />
            Deadline Tracker
          </h3>
          <p className="text-sm text-muted-foreground">
            Upcoming and overdue editorial deadlines
          </p>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {deadlines.map((deadline, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                deadline.status === 'overdue' ? 'border-red-200 bg-red-50' :
                deadline.status === 'due_today' ? 'border-yellow-200 bg-yellow-50' :
                'border-gray-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                      <Badge className={getDeadlineColor(deadline.status)} variant="outline">
                        {deadline.status.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={deadline.priority === 'high' ? 'border-red-200 text-red-600' :
                                  deadline.priority === 'medium' ? 'border-yellow-200 text-yellow-600' :
                                  'border-green-200 text-green-600'}
                      >
                        {deadline.priority} priority
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(deadline.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{deadline.assignee}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {deadline.daysRemaining > 0 
                            ? `${deadline.daysRemaining} days remaining`
                            : deadline.daysRemaining === 0
                            ? 'Due today'
                            : `${Math.abs(deadline.daysRemaining)} days overdue`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Production Statistics */}
      <Card className="p-6 card-academic">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Production Statistics
          </h3>
          <p className="text-sm text-muted-foreground">
            Publishing performance metrics for {selectedYear}
          </p>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {metrics ? Math.round((metrics.publishedOnTime / metrics.totalIssues) * 100) : 0}%
              </div>
              <p className="text-sm text-gray-600">On-Time Publications</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics?.publishedOnTime || 0} of {metrics?.totalIssues || 0} issues
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-amber-600 mb-2">
                {metrics?.averageDelay || 0}d
              </div>
              <p className="text-sm text-gray-600">Average Delay</p>
              <p className="text-xs text-gray-500 mt-1">When deadlines are missed</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {publications.reduce((sum, p) => sum + p.manuscriptCount, 0)}
              </div>
              <p className="text-sm text-gray-600">Total Manuscripts</p>
              <p className="text-xs text-gray-500 mt-1">Across all planned issues</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}