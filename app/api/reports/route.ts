import { NextResponse } from 'next/server';
import { createBigQueryClient } from '@/lib/bigquery';
import { BIGQUERY_DATASET } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const reportData = await request.json();

    // Basic validation - match the BigQuery table schema
    if (!reportData || !reportData.name || !reportData.group_id || !reportData.dataset_id || !reportData.type) {
      return NextResponse.json({ error: 'Invalid data: name, group_id, dataset_id, and type are required.' }, { status: 400 });
    }

    // Validate report name - only alphanumeric, underscores, and hyphens (no spaces)
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nameRegex.test(reportData.name)) {
      return NextResponse.json({ 
        error: 'Report name must contain only letters, numbers, underscores, and hyphens (no spaces).' 
      }, { status: 400 });
    }

    // Use centralized BigQuery client configuration
    const bigquery = createBigQueryClient();

    const datasetId = BIGQUERY_DATASET;
    const tableId = "reports";

    // Use query-based INSERT instead of streaming to allow immediate deletion
    const insertQuery = `
      INSERT INTO \`dw-intelligence-industrielle.${datasetId}.reports\`
      (name, group_id, dataset_id, type, client_id)
      VALUES (@name, @group_id, @dataset_id, @type, @client_id)
    `;

    const [job] = await bigquery.createQueryJob({
      query: insertQuery,
      params: {
        name: reportData.name,
        group_id: reportData.group_id,
        dataset_id: reportData.dataset_id,
        type: reportData.type,
        client_id: reportData.client_id || null,
      },
      types: {
        name: 'STRING',
        group_id: 'STRING',
        dataset_id: 'STRING',
        type: 'STRING',
        client_id: 'STRING',
      },
      location: 'US',
    });

    await job.getQueryResults();

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

    const datasetId = BIGQUERY_DATASET;
    const tableId = "reports";

    // Delete the specific report using dataset_id as primary key
    const deleteQuery = `
      DELETE FROM \`dw-intelligence-industrielle.${datasetId}.reports\`
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
