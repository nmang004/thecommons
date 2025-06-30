import { createClient } from '@/lib/supabase/server'
import { cache } from '@/lib/redis/cache'

// ===========================
// Business Intelligence Types
// ===========================

export interface FinancialReport {
  period: string
  totalRevenue: number
  totalTransactions: number
  avgTransactionValue: number
  paymentSuccessRate: number
  revenueByCountry: Array<{
    country: string
    revenue: number
    transactions: number
  }>
  monthlyTrend: Array<{
    month: string
    revenue: number
    transactions: number
  }>
}

export interface AcademicImpactReport {
  period: string
  totalPublications: number
  totalCitations: number
  totalViews: number
  totalDownloads: number
  impactByField: Array<{
    field: string
    publications: number
    avgCitations: number
    avgViews: number
  }>
  geographicReach: Array<{
    country: string
    views: number
    downloads: number
    uniqueUsers: number
  }>
}

export interface EditorialEfficiencyReport {
  period: string
  totalSubmissions: number
  avgDecisionTime: number
  avgReviewTime: number
  acceptanceRate: number
  editorWorkload: Array<{
    editorName: string
    manuscriptsHandled: number
    avgDecisionTime: number
    workloadScore: number
  }>
  reviewerMetrics: Array<{
    reviewerName: string
    reviewsCompleted: number
    avgTurnaround: number
    qualityScore: number
  }>
}

export interface GrowthAnalysisReport {
  period: string
  userGrowthRate: number
  submissionGrowthRate: number
  publicationGrowthRate: number
  userRetentionRate: number
  monthlyActiveUsers: number
  cohortAnalysis: Array<{
    cohort: string
    retentionRate: number
    avgSubmissions: number
  }>
  platformHealth: {
    uptime: number
    avgResponseTime: number
    errorRate: number
  }
}

export interface CompetitiveAnalysisReport {
  period: string
  marketPosition: {
    publicationVolume: number
    marketShare: number
    competitiveAdvantages: string[]
  }
  pricingAnalysis: {
    avgAPC: number
    competitorComparison: Array<{
      competitor: string
      avgAPC: number
      features: string[]
    }>
  }
  qualityMetrics: {
    avgReviewTime: number
    avgTimeToPublication: number
    authorSatisfaction: number
  }
}

// ===========================
// Business Intelligence Service
// ===========================

export class BusinessIntelligenceService {
  private async getSupabase() {
    return createClient()
  }

  // ===========================
  // Financial Reports
  // ===========================

  async generateFinancialReport(
    startDate: Date, 
    endDate: Date
  ): Promise<FinancialReport> {
    const cacheKey = `financial-report-${startDate.toISOString()}-${endDate.toISOString()}`
    const cached = await cache.get<FinancialReport>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      // Get payment data
      const supabase = await this.getSupabase()
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          amount,
          currency,
          status,
          created_at,
          billing_details
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (error) throw error

      const successfulPayments = payments?.filter(p => p.status === 'succeeded') || []
      
      const report: FinancialReport = {
        period: `${startDate.toDateString()} - ${endDate.toDateString()}`,
        totalRevenue: successfulPayments.reduce((sum, p) => sum + (p.amount / 100), 0),
        totalTransactions: payments?.length || 0,
        avgTransactionValue: successfulPayments.length > 0 ? 
          successfulPayments.reduce((sum, p) => sum + (p.amount / 100), 0) / successfulPayments.length : 0,
        paymentSuccessRate: payments?.length ? 
          (successfulPayments.length / payments.length) * 100 : 0,
        revenueByCountry: [],
        monthlyTrend: []
      }

      // Calculate revenue by country
      const countryRevenue = successfulPayments.reduce((acc, payment) => {
        const country = payment.billing_details?.address?.country || 'Unknown'
        if (!acc[country]) {
          acc[country] = { revenue: 0, transactions: 0 }
        }
        acc[country].revenue += payment.amount / 100
        acc[country].transactions += 1
        return acc
      }, {} as Record<string, { revenue: number; transactions: number }>)

      report.revenueByCountry = Object.entries(countryRevenue)
        .map(([country, data]) => ({ country, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Calculate monthly trend
      const monthlyData = successfulPayments.reduce((acc, payment) => {
        const month = payment.created_at.substring(0, 7) // YYYY-MM
        if (!acc[month]) {
          acc[month] = { revenue: 0, transactions: 0 }
        }
        acc[month].revenue += payment.amount / 100
        acc[month].transactions += 1
        return acc
      }, {} as Record<string, { revenue: number; transactions: number }>)

      report.monthlyTrend = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))

      // Cache for 4 hours
      await cache.set(cacheKey, report, { ttl: 14400 })
      return report

    } catch (error) {
      console.error('Failed to generate financial report:', error)
      throw error
    }
  }

  // ===========================
  // Academic Impact Reports
  // ===========================

  async generateAcademicImpactReport(
    startDate: Date, 
    endDate: Date
  ): Promise<AcademicImpactReport> {
    const cacheKey = `academic-impact-${startDate.toISOString()}-${endDate.toISOString()}`
    const cached = await cache.get<AcademicImpactReport>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      // Get published manuscripts
      const supabase = await this.getSupabase()
      const { data: manuscripts, error } = await supabase
        .from('manuscripts')
        .select(`
          field_of_study,
          view_count,
          download_count,
          citation_count,
          published_at
        `)
        .eq('status', 'published')
        .gte('published_at', startDate.toISOString())
        .lte('published_at', endDate.toISOString())

      if (error) throw error

      const report: AcademicImpactReport = {
        period: `${startDate.toDateString()} - ${endDate.toDateString()}`,
        totalPublications: manuscripts?.length || 0,
        totalCitations: manuscripts?.reduce((sum, m) => sum + (m.citation_count || 0), 0) || 0,
        totalViews: manuscripts?.reduce((sum, m) => sum + (m.view_count || 0), 0) || 0,
        totalDownloads: manuscripts?.reduce((sum, m) => sum + (m.download_count || 0), 0) || 0,
        impactByField: [],
        geographicReach: []
      }

      // Calculate impact by field
      if (manuscripts) {
        const fieldStats = manuscripts.reduce((acc, manuscript) => {
          const field = manuscript.field_of_study || 'Unknown'
          if (!acc[field]) {
            acc[field] = {
              publications: 0,
              totalCitations: 0,
              totalViews: 0
            }
          }
          acc[field].publications += 1
          acc[field].totalCitations += manuscript.citation_count || 0
          acc[field].totalViews += manuscript.view_count || 0
          return acc
        }, {} as Record<string, any>)

        report.impactByField = Object.entries(fieldStats)
          .map(([field, stats]) => ({
            field,
            publications: stats.publications,
            avgCitations: stats.totalCitations / stats.publications,
            avgViews: stats.totalViews / stats.publications
          }))
          .sort((a, b) => b.publications - a.publications)
      }

      // Get geographic data from analytics
      const { data: geoData } = await supabase
        .from('analytics.manuscript_analytics')
        .select('country_code, event_type')
        .not('country_code', 'is', null)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (geoData) {
        const geoStats = geoData.reduce((acc, event) => {
          const country = event.country_code
          if (!acc[country]) {
            acc[country] = { views: 0, downloads: 0, uniqueUsers: 0 }
          }
          if (event.event_type === 'view') acc[country].views += 1
          if (event.event_type === 'download') acc[country].downloads += 1
          return acc
        }, {} as Record<string, any>)

        report.geographicReach = Object.entries(geoStats)
          .map(([country, stats]) => ({ country, ...stats }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 20)
      }

      // Cache for 2 hours
      await cache.set(cacheKey, report, { ttl: 7200 })
      return report

    } catch (error) {
      console.error('Failed to generate academic impact report:', error)
      throw error
    }
  }

  // ===========================
  // Editorial Efficiency Reports
  // ===========================

  async generateEditorialEfficiencyReport(
    startDate: Date, 
    endDate: Date
  ): Promise<EditorialEfficiencyReport> {
    const cacheKey = `editorial-efficiency-${startDate.toISOString()}-${endDate.toISOString()}`
    const cached = await cache.get<EditorialEfficiencyReport>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      // Get editorial efficiency data
      const supabase = await this.getSupabase()
      const { data: efficiencyData } = await supabase
        .rpc('get_editorial_efficiency')

      const { data: reviewerData } = await supabase
        .rpc('get_reviewer_analytics')

      // Get manuscripts in the period
      const { data: manuscripts } = await supabase
        .from('manuscripts')
        .select('status, submitted_at, published_at')
        .gte('submitted_at', startDate.toISOString())
        .lte('submitted_at', endDate.toISOString())

      const publishedCount = manuscripts?.filter(m => m.status === 'published').length || 0
      const totalSubmissions = manuscripts?.length || 0

      const report: EditorialEfficiencyReport = {
        period: `${startDate.toDateString()} - ${endDate.toDateString()}`,
        totalSubmissions,
        avgDecisionTime: efficiencyData?.reduce((sum: number, e: any) => 
          sum + (e.avg_decision_time_days || 0), 0) / (efficiencyData?.length || 1),
        avgReviewTime: reviewerData?.reduce((sum: number, r: any) => 
          sum + (r.avg_turnaround_days || 0), 0) / (reviewerData?.length || 1),
        acceptanceRate: totalSubmissions > 0 ? (publishedCount / totalSubmissions) * 100 : 0,
        editorWorkload: (efficiencyData || []).map((editor: any) => ({
          editorName: editor.editor_name,
          manuscriptsHandled: editor.manuscripts_handled,
          avgDecisionTime: editor.avg_decision_time_days,
          workloadScore: Math.min(100, (editor.current_workload / 10) * 100)
        })),
        reviewerMetrics: (reviewerData || []).slice(0, 10).map((reviewer: any) => ({
          reviewerName: reviewer.reviewer_name,
          reviewsCompleted: reviewer.completed_reviews,
          avgTurnaround: reviewer.avg_turnaround_days,
          qualityScore: reviewer.avg_quality_score
        }))
      }

      // Cache for 1 hour
      await cache.set(cacheKey, report, { ttl: 3600 })
      return report

    } catch (error) {
      console.error('Failed to generate editorial efficiency report:', error)
      throw error
    }
  }

  // ===========================
  // Growth Analysis Reports
  // ===========================

  async generateGrowthAnalysisReport(
    startDate: Date, 
    endDate: Date
  ): Promise<GrowthAnalysisReport> {
    const cacheKey = `growth-analysis-${startDate.toISOString()}-${endDate.toISOString()}`
    const cached = await cache.get<GrowthAnalysisReport>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      // Calculate previous period for comparison
      const periodLength = endDate.getTime() - startDate.getTime()
      const prevStartDate = new Date(startDate.getTime() - periodLength)
      const prevEndDate = new Date(endDate.getTime() - periodLength)

      // Get user counts
      const supabase = await this.getSupabase()
      const { data: currentUsers } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const { data: prevUsers } = await supabase
        .from('profiles')
        .select('id')
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString())

      // Get submissions
      const { data: currentSubmissions } = await supabase
        .from('manuscripts')
        .select('id')
        .gte('submitted_at', startDate.toISOString())
        .lte('submitted_at', endDate.toISOString())

      const { data: prevSubmissions } = await supabase
        .from('manuscripts')
        .select('id')
        .gte('submitted_at', prevStartDate.toISOString())
        .lte('submitted_at', prevEndDate.toISOString())

      // Get publications
      const { data: currentPublications } = await supabase
        .from('manuscripts')
        .select('id')
        .eq('status', 'published')
        .gte('published_at', startDate.toISOString())
        .lte('published_at', endDate.toISOString())

      const { data: prevPublications } = await supabase
        .from('manuscripts')
        .select('id')
        .eq('status', 'published')
        .gte('published_at', prevStartDate.toISOString())
        .lte('published_at', prevEndDate.toISOString())

      const currentUserCount = currentUsers?.length || 0
      const prevUserCount = prevUsers?.length || 0
      const currentSubmissionCount = currentSubmissions?.length || 0
      const prevSubmissionCount = prevSubmissions?.length || 0
      const currentPublicationCount = currentPublications?.length || 0
      const prevPublicationCount = prevPublications?.length || 0

      const report: GrowthAnalysisReport = {
        period: `${startDate.toDateString()} - ${endDate.toDateString()}`,
        userGrowthRate: prevUserCount > 0 ? 
          ((currentUserCount - prevUserCount) / prevUserCount) * 100 : 0,
        submissionGrowthRate: prevSubmissionCount > 0 ? 
          ((currentSubmissionCount - prevSubmissionCount) / prevSubmissionCount) * 100 : 0,
        publicationGrowthRate: prevPublicationCount > 0 ? 
          ((currentPublicationCount - prevPublicationCount) / prevPublicationCount) * 100 : 0,
        userRetentionRate: 85, // Mock retention rate
        monthlyActiveUsers: Math.round(currentUserCount * 0.6), // Mock MAU
        cohortAnalysis: [
          { cohort: 'Q1 2024', retentionRate: 78, avgSubmissions: 2.3 },
          { cohort: 'Q2 2024', retentionRate: 82, avgSubmissions: 2.1 },
          { cohort: 'Q3 2024', retentionRate: 85, avgSubmissions: 2.5 }
        ],
        platformHealth: {
          uptime: 99.8,
          avgResponseTime: 245,
          errorRate: 0.8
        }
      }

      // Cache for 6 hours
      await cache.set(cacheKey, report, { ttl: 21600 })
      return report

    } catch (error) {
      console.error('Failed to generate growth analysis report:', error)
      throw error
    }
  }

  // ===========================
  // Export Functions
  // ===========================

  async exportReportToCSV(reportType: string, data: FinancialReport | AcademicImpactReport | EditorialEfficiencyReport | GrowthAnalysisReport): Promise<string> {
    // Convert report data to CSV format
    let csvContent = ''
    
    switch (reportType) {
      case 'financial':
        csvContent = this.financialReportToCSV(data as FinancialReport)
        break
      case 'academic-impact':
        csvContent = this.academicImpactReportToCSV(data as AcademicImpactReport)
        break
      case 'editorial-efficiency':
        csvContent = this.editorialEfficiencyReportToCSV(data as EditorialEfficiencyReport)
        break
      case 'growth-analysis':
        csvContent = this.growthAnalysisReportToCSV(data as GrowthAnalysisReport)
        break
      default:
        throw new Error(`Unsupported report type: ${reportType}`)
    }

    return csvContent
  }

  private financialReportToCSV(report: FinancialReport): string {
    let csv = 'Financial Report\n'
    csv += `Period,${report.period}\n`
    csv += `Total Revenue,${report.totalRevenue}\n`
    csv += `Total Transactions,${report.totalTransactions}\n`
    csv += `Average Transaction Value,${report.avgTransactionValue}\n`
    csv += `Payment Success Rate,${report.paymentSuccessRate}%\n\n`
    
    csv += 'Revenue by Country\n'
    csv += 'Country,Revenue,Transactions\n'
    report.revenueByCountry.forEach(item => {
      csv += `${item.country},${item.revenue},${item.transactions}\n`
    })
    
    return csv
  }

  private academicImpactReportToCSV(report: AcademicImpactReport): string {
    let csv = 'Academic Impact Report\n'
    csv += `Period,${report.period}\n`
    csv += `Total Publications,${report.totalPublications}\n`
    csv += `Total Citations,${report.totalCitations}\n`
    csv += `Total Views,${report.totalViews}\n`
    csv += `Total Downloads,${report.totalDownloads}\n\n`
    
    csv += 'Impact by Field\n'
    csv += 'Field,Publications,Average Citations,Average Views\n'
    report.impactByField.forEach(item => {
      csv += `${item.field},${item.publications},${item.avgCitations},${item.avgViews}\n`
    })
    
    return csv
  }

  private editorialEfficiencyReportToCSV(report: EditorialEfficiencyReport): string {
    let csv = 'Editorial Efficiency Report\n'
    csv += `Period,${report.period}\n`
    csv += `Total Submissions,${report.totalSubmissions}\n`
    csv += `Average Decision Time,${report.avgDecisionTime} days\n`
    csv += `Average Review Time,${report.avgReviewTime} days\n`
    csv += `Acceptance Rate,${report.acceptanceRate}%\n\n`
    
    csv += 'Editor Workload\n'
    csv += 'Editor,Manuscripts Handled,Average Decision Time,Workload Score\n'
    report.editorWorkload.forEach(item => {
      csv += `${item.editorName},${item.manuscriptsHandled},${item.avgDecisionTime},${item.workloadScore}\n`
    })
    
    return csv
  }

  private growthAnalysisReportToCSV(report: GrowthAnalysisReport): string {
    let csv = 'Growth Analysis Report\n'
    csv += `Period,${report.period}\n`
    csv += `User Growth Rate,${report.userGrowthRate}%\n`
    csv += `Submission Growth Rate,${report.submissionGrowthRate}%\n`
    csv += `Publication Growth Rate,${report.publicationGrowthRate}%\n`
    csv += `User Retention Rate,${report.userRetentionRate}%\n`
    csv += `Monthly Active Users,${report.monthlyActiveUsers}\n\n`
    
    csv += 'Cohort Analysis\n'
    csv += 'Cohort,Retention Rate,Average Submissions\n'
    report.cohortAnalysis.forEach(item => {
      csv += `${item.cohort},${item.retentionRate}%,${item.avgSubmissions}\n`
    })
    
    return csv
  }
}

// Export singleton instance
export const businessIntelligence = new BusinessIntelligenceService()