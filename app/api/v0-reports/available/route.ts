import { NextRequest, NextResponse } from 'next/server';
import { createBigQueryClient } from '@/lib/bigquery';

// Cache for 1 hour (can be bypassed with ?refresh param)
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  // Check if force refresh is requested
  const forceRefresh = request.nextUrl.searchParams.has('refresh');
  try {
    const bigquery = createBigQueryClient();

    // Query to get all available reports from the Reports table
    const query = `
      SELECT id, name, sub_domain
      FROM \`dw-intelligence-industrielle.Application_V0Report.Reports\`
      ORDER BY name ASC
    `;

    const [rows] = await bigquery.query({
      query: query,
      location: 'US',
    });

    return NextResponse.json({ 
      success: true, 
      reports: rows 
    }, { 
      status: 200,
      headers: forceRefresh ? {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      } : {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      }
    });

  } catch (error) {
    console.error("Failed to fetch available v0 reports from BigQuery:", error);
    
    let errorMessage = 'An internal server error occurred while fetching available reports.';
    if (error instanceof Error) {
        if (error.message.includes('NOT_FOUND')) {
            errorMessage = 'BigQuery Reports table not found. Please verify your configuration.';
        } else if (error.message.includes('ENOENT') || error.message.includes('credential file')) {
            errorMessage = 'Authentication error: Could not find the ii-access.json file.';
        }
    }
    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

