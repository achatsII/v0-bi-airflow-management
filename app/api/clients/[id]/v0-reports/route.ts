import { NextRequest, NextResponse } from 'next/server';
import { createBigQueryClient } from '@/lib/bigquery';
import { BIGQUERY_DATASET } from '@/lib/config';

// Cache for 1 hour (can be bypassed with ?refresh param)
export const revalidate = 3600;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Check if force refresh is requested
  const forceRefresh = request.nextUrl.searchParams.has('refresh');
  try {
    const clientId = params.id;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required.' }, { status: 400 });
    }

    const bigquery = createBigQueryClient();

    // First, get the client name from the client ID
    const clientQuery = `
      SELECT name
      FROM \`dw-intelligence-industrielle.${BIGQUERY_DATASET}.k2_clients\`
      WHERE id = @client_id
      LIMIT 1
    `;

    const [clientRows] = await bigquery.query({
      query: clientQuery,
      params: { client_id: clientId },
      types: { client_id: 'STRING' },
      location: 'US',
    });

    if (clientRows.length === 0) {
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    }

    const clientName = clientRows[0].name;

    // Now fetch all v0 reports for this client (both active and inactive)
    const reportsQuery = `
      SELECT report_id, report_name, client_name, sub_domain, uuid, is_active
      FROM \`dw-intelligence-industrielle.Application_V0Report.app_client_reports\`
      WHERE client_name = @client_name
      ORDER BY report_name ASC
    `;

    const [reportRows] = await bigquery.query({
      query: reportsQuery,
      params: { client_name: clientName },
      types: { client_name: 'STRING' },
      location: 'US',
    });

    return NextResponse.json({ 
      success: true, 
      reports: reportRows,
      client_id: clientId,
      client_name: clientName
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
    console.error("Failed to fetch v0 reports for client:", error);
    
    let errorMessage = 'An internal server error occurred while fetching v0 reports.';
    if (error instanceof Error) {
        if (error.message.includes('NOT_FOUND')) {
            errorMessage = 'BigQuery table or view not found. Please verify your configuration.';
        } else if (error.message.includes('ENOENT') || error.message.includes('credential file')) {
            errorMessage = 'Authentication error: Could not find the ii-access.json file.';
        }
    }
    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id;
    const body = await request.json();

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required.' }, { status: 400 });
    }

    const { report_id, uuid } = body;

    if (!report_id || !uuid) {
      return NextResponse.json({ error: 'report_id and uuid are required.' }, { status: 400 });
    }

    const bigquery = createBigQueryClient();

    // Insert into ClientReports table with isActive = false
    const insertQuery = `
      INSERT INTO \`dw-intelligence-industrielle.Application_V0Report.ClientReports\`
      (client_id, report_id, uuid, isActive)
      VALUES (@client_id, @report_id, @uuid, false)
    `;

    await bigquery.query({
      query: insertQuery,
      params: { 
        client_id: clientId,
        report_id: report_id,
        uuid: uuid
      },
      types: { 
        client_id: 'STRING',
        report_id: 'STRING',
        uuid: 'STRING'
      },
      location: 'US',
    });

    return NextResponse.json({ 
      success: true,
      message: 'UUID assigned successfully',
      data: {
        client_id: clientId,
        report_id: report_id,
        uuid: uuid,
        isActive: false
      }
    }, { 
      status: 201
    });

  } catch (error) {
    console.error("Failed to assign UUID:", error);
    
    let errorMessage = 'An internal server error occurred while assigning UUID.';
    if (error instanceof Error) {
        if (error.message.includes('NOT_FOUND')) {
            errorMessage = 'BigQuery ClientReports table not found. Please verify your configuration.';
        } else if (error.message.includes('ENOENT') || error.message.includes('credential file')) {
            errorMessage = 'Authentication error: Could not find the ii-access.json file.';
        } else if (error.message.includes('Already Exists') || error.message.includes('duplicate')) {
            errorMessage = 'This report already has a UUID assigned for this client.';
        }
    }
    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

