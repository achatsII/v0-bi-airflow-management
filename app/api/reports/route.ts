import { NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

export async function POST(request: Request) {
  try {
    const reportData = await request.json();

    // Basic validation - match the BigQuery table schema
    if (!reportData || !reportData.name || !reportData.group_id || !reportData.dataset_id || !reportData.type) {
      return NextResponse.json({ error: 'Invalid data: name, group_id, dataset_id, and type are required.' }, { status: 400 });
    }

    // Use environment variables for secure configuration
    const bigquery = new BigQuery({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    const datasetId = "Manual";
    const tableId = "reports";

    // Prepare data for BigQuery insertion - match table schema exactly
    const rowsToInsert = [{
      name: reportData.name,
      group_id: reportData.group_id,
      dataset_id: reportData.dataset_id,
      type: reportData.type,
      client_id: reportData.client_id || null, // Optional field
    }];

    await bigquery
      .dataset(datasetId)
      .table(tableId)
      .insert(rowsToInsert);

    return NextResponse.json({ success: true, message: 'Report added to BigQuery successfully.' }, { status: 201 });

  } catch (error) {
    console.error("Failed to insert data into BigQuery:", error);
    
    let errorMessage = 'An internal server error occurred.';
    if (error instanceof Error) {
        if (error.message.includes('NOT_FOUND')) {
            errorMessage = 'BigQuery dataset or table not found. Please verify your configuration.';
        } else if (error.message.includes('ENOENT') || error.message.includes('credential file')) {
            errorMessage = 'Authentication error: Could not find the ii-access.json file. Please ensure it is in the project root directory.';
        }
    }
    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
