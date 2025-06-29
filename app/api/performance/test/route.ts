import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-security'
import { performanceValidator } from '@/lib/testing/performance-tests'

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('type') || 'all'
    const saveReport = searchParams.get('save') === 'true'
    
    let reports
    
    switch (testType) {
      case 'core-web-vitals':
        reports = await performanceValidator.runCoreWebVitalsTests()
        break
      case 'all':
      default:
        reports = await performanceValidator.runAllTests()
        break
    }
    
    // Generate human-readable report
    const reportText = performanceValidator.generateReport(reports)
    
    // Save report if requested
    if (saveReport) {
      await performanceValidator.saveReport(reports)
    }
    
    // Calculate overall metrics
    const totalTests = reports.length
    const passedTests = reports.filter(r => r.passed).length
    const averageScore = Math.round(reports.reduce((sum, r) => sum + r.score, 0) / totalTests)
    const successRate = Math.round((passedTests / totalTests) * 100)
    
    return NextResponse.json({
      success: true,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        averageScore,
        successRate,
        timestamp: new Date().toISOString()
      },
      tests: reports,
      report: reportText,
      coreWebVitals: {
        lcp: reports.find(r => r.testName.includes('LCP')),
        fid: reports.find(r => r.testName.includes('FID')),
        cls: reports.find(r => r.testName.includes('CLS'))
      }
    })
    
  } catch (error) {
    console.error('Performance test error:', error)
    return NextResponse.json(
      { error: 'Failed to run performance tests' },
      { status: 500 }
    )
  }
}

// Apply security - only allow admins to run performance tests
export const GET = withSecurity({
  auth: true,
  roles: ['admin'],
  rateLimit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10 // Max 10 performance test runs per hour
  }
})(handler)