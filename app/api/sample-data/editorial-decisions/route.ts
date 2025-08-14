import { NextRequest, NextResponse } from 'next/server'
import { createSampleEditorialDecisions } from '@/lib/sample-data/editorial-decisions'

export async function POST(_request: NextRequest) {
  try {
    const data = await createSampleEditorialDecisions()
    
    return NextResponse.json({
      success: true,
      message: `Successfully created ${data?.length || 0} sample editorial decisions`,
      data
    })
  } catch (error) {
    console.error('Failed to create sample editorial decisions:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to create sample editorial decisions data',
    endpoint: '/api/sample-data/editorial-decisions',
    method: 'POST'
  })
}