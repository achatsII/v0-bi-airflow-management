import { NextResponse } from 'next/server';
import { createBigQueryClient } from '@/lib/bigquery';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id;

    // Validate required client ID
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required.' }, { status: 400 });
    }

    // Use centralized BigQuery client configuration
    const bigquery = createBigQueryClient();

    const datasetId = "Manual";
    const tableId = "reports";

    // Query to get all reports for the specific client
    const query = `
      SELECT name, group_id, dataset_id, type
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${datasetId}.${tableId}\`
      WHERE client_id = @client_id
      ORDER BY name ASC
    `;

    const [rows] = await bigquery.query({
      query: query,
      params: { client_id: clientId },
      types: { client_id: 'STRING' },
      location: 'US',
    });

    return NextResponse.json({ 
      success: true, 
      reports: rows,
      client_id: clientId 
    }, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch reports for client:", error);
    
    let errorMessage = 'An internal server error occurred while fetching reports.';
    if (error instanceof Error) {
        if (error.message.includes('NOT_FOUND')) {
            errorMessage = 'BigQuery reports table not found. Please verify your configuration.';
        } else if (error.message.includes('ENOENT') || error.message.includes('credential file')) {
            errorMessage = 'Authentication error: Could not find the ii-access.json file.';
        }
    }
    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
