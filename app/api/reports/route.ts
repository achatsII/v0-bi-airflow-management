import { NextResponse } from 'next/server';
import { createBigQueryClient } from '@/lib/bigquery';

export async function POST(request: Request) {
  try {
    const reportData = await request.json();

    // Basic validation - match the BigQuery table schema
    if (!reportData || !reportData.name || !reportData.group_id || !reportData.dataset_id || !reportData.type) {
      return NextResponse.json({ error: 'Invalid data: name, group_id, dataset_id, and type are required.' }, { status: 400 });
    }

    // Use centralized BigQuery client configuration
    const bigquery = createBigQueryClient();

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

export async function DELETE(request: Request) {
  console.log('🗑️ DELETE /api/reports - Request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const dataset_id = searchParams.get('dataset_id');
    
    console.log('📊 Dataset ID to delete:', dataset_id);

    // Validate required parameter
    if (!dataset_id) {
      console.log('❌ No dataset_id provided');
      return NextResponse.json({ 
        error: 'Missing required parameter: dataset_id is required.' 
      }, { status: 400 });
    }

    // Use centralized BigQuery client configuration
    const bigquery = createBigQueryClient();

    const datasetId = "Manual";
    const tableId = "reports";

    // Delete the specific report using dataset_id as primary key
    const deleteQuery = `
      DELETE FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${datasetId}.${tableId}\`
      WHERE dataset_id = @dataset_id
    `;

    console.log('📝 Executing delete query:', deleteQuery);
    console.log('🔧 With parameters:', { dataset_id });
    console.log('🏢 Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('📊 Dataset:', datasetId);
    console.log('📋 Table:', tableId);

    const [job] = await bigquery.createQueryJob({
      query: deleteQuery,
      params: { dataset_id },
      types: { dataset_id: 'STRING' },
      location: 'US',
    });

    await job.getQueryResults();

    // Check if any rows were affected
    const [metadata] = await job.getMetadata();
    const numDmlAffectedRows = metadata.statistics?.query?.numDmlAffectedRows;

    if (numDmlAffectedRows === '0') {
      return NextResponse.json({ 
        error: 'Report not found or already deleted.' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report deleted successfully.',
      affectedRows: numDmlAffectedRows
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Failed to delete report:");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Full error object:", error);
    
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    
    let errorMessage = 'An internal server error occurred while deleting the report.';
    if (error instanceof Error) {
        console.log("🔍 Analyzing error message:", error.message);
        if (error.message.includes('NOT_FOUND')) {
            errorMessage = 'BigQuery reports table not found. Please verify your configuration.';
        } else if (error.message.includes('ENOENT') || error.message.includes('credential file')) {
            errorMessage = 'Authentication error: Could not find the ii-access.json file.';
        } else {
            // Include the actual error message for debugging
            errorMessage = `Server error: ${error.message}`;
        }
    }
    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
