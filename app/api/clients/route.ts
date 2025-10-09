import { NextResponse } from 'next/server';
import { createBigQueryClient } from '@/lib/bigquery';

export async function GET() {
  try {
    // Use centralized BigQuery client configuration
    const bigquery = createBigQueryClient();

    const datasetId = "Manual";
    const tableId = "k2_clients";

    // Query to get all clients
    const query = `
      SELECT *
      FROM \`dw-intelligence-industrielle.Application_Airflow.k2_clients\`
      ORDER BY name ASC
    `;

    const [rows] = await bigquery.query({
      query: query,
      location: 'US', // Specify the location if needed
    });

    return NextResponse.json({ 
      success: true, 
      clients: rows 
    }, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch clients from BigQuery:", error);
    
    let errorMessage = 'An internal server error occurred while fetching clients.';
    if (error instanceof Error) {
        if (error.message.includes('NOT_FOUND')) {
            errorMessage = 'BigQuery k2_clients table not found. Please verify your configuration.';
        } else if (error.message.includes('ENOENT') || error.message.includes('credential file')) {
            errorMessage = 'Authentication error: Could not find the ii-access.json file. Please ensure it is in the project root directory.';
        }
    }
    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
