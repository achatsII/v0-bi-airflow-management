import { NextResponse } from 'next/server';
import { createBigQueryClient } from '@/lib/bigquery';
import { BIGQUERY_DATASET } from '@/lib/config';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  console.log('🔧 PUT /api/clients/[id] - Request received');
  console.log('📋 Client ID:', params.id);
  
  try {
    const clientId = params.id;
    const configData = await request.json();
    
    console.log('📊 Config data received:', JSON.stringify(configData, null, 2));

    // Validate required client ID
    if (!clientId) {
      console.log('❌ No client ID provided');
      return NextResponse.json({ error: 'Client ID is required.' }, { status: 400 });
    }

    // Use centralized BigQuery client configuration
    const bigquery = createBigQueryClient();

    const datasetId = BIGQUERY_DATASET;
    const tableId = "k2_clients";

    // Build the UPDATE query with the configuration data
    const updateFields = [];
    const queryParams: any = { client_id: clientId };

    // Map frontend fields to database columns
    if (configData.docker_version !== undefined) {
      updateFields.push('docker_version = @docker_version');
      queryParams.docker_version = configData.docker_version || null;
    }

    if (configData.cron_expression !== undefined) {
      updateFields.push('cron_expression = @cron_expression');
      queryParams.cron_expression = configData.cron_expression || null;
    }

    if (configData.cron_timezone !== undefined) {
      updateFields.push('cron_timezone = @cron_timezone');
      queryParams.cron_timezone = configData.cron_timezone || null;
    }

    // Handle boolean toggles
    if (configData.toggles !== undefined) {
      const toggles = configData.toggles || [];
      
      updateFields.push('toggle_part_events = @toggle_part_events');
      queryParams.toggle_part_events = toggles.includes('part_events');
      
      updateFields.push('toggle_performance_loss = @toggle_performance_loss');
      queryParams.toggle_performance_loss = toggles.includes('performance_loss');
      
      // Store custom toggle value as raw JSON if it exists
      const customValue = configData.customToggleValue || "";
      updateFields.push('toggle_custom = @toggle_custom');
      
      if (customValue) {
        try {
          // Validate JSON before saving
          JSON.parse(customValue);
          queryParams.toggle_custom = customValue; // Store raw JSON string
        } catch {
          return NextResponse.json({ error: 'Invalid JSON in custom configuration.' }, { status: 400 });
        }
      } else {
        queryParams.toggle_custom = null;
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid configuration fields provided for update.' }, { status: 400 });
    }

    // Execute the UPDATE query
    const updateQuery = `
      UPDATE \`dw-intelligence-industrielle.${datasetId}.k2_clients\`
      SET ${updateFields.join(', ')}
      WHERE id = @client_id
    `;

    console.log('📝 Executing update query:', updateQuery);
    console.log('🔧 With parameters:', JSON.stringify(queryParams, null, 2));
    console.log('🏢 Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('📊 Dataset:', datasetId);
    console.log('📋 Table:', tableId);

    // Define parameter types for BigQuery
    const parameterTypes: any = {
      client_id: 'STRING'
    };

    // Add types for each parameter that might be null
    if (queryParams.docker_version !== undefined) {
      parameterTypes.docker_version = 'STRING';
    }
    if (queryParams.cron_expression !== undefined) {
      parameterTypes.cron_expression = 'STRING';
    }
    if (queryParams.cron_timezone !== undefined) {
      parameterTypes.cron_timezone = 'STRING';
    }
    if (queryParams.toggle_part_events !== undefined) {
      parameterTypes.toggle_part_events = 'BOOL';
    }
    if (queryParams.toggle_performance_loss !== undefined) {
      parameterTypes.toggle_performance_loss = 'BOOL';
    }
    if (queryParams.toggle_custom !== undefined) {
      parameterTypes.toggle_custom = 'JSON';
    }

    console.log('🔧 Parameter types:', JSON.stringify(parameterTypes, null, 2));

    const [job] = await bigquery.createQueryJob({
      query: updateQuery,
      params: queryParams,
      types: parameterTypes,
      location: 'US',
    });

    await job.getQueryResults();

    // Verify the update was successful by checking affected rows
    const [metadata] = await job.getMetadata();
    const numDmlAffectedRows = metadata.statistics?.query?.numDmlAffectedRows;

    if (numDmlAffectedRows === '0') {
      return NextResponse.json({ 
        error: 'Client not found or no changes made.' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Client configuration updated successfully.',
      affectedRows: numDmlAffectedRows
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Failed to update client configuration:");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Full error object:", error);
    
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    
    let errorMessage = 'An internal server error occurred while updating client configuration.';
    if (error instanceof Error) {
        console.log("🔍 Analyzing error message:", error.message);
        if (error.message.includes('NOT_FOUND')) {
            errorMessage = 'BigQuery k2_clients table not found. Please verify your configuration.';
        } else if (error.message.includes('ENOENT') || error.message.includes('credential file')) {
            errorMessage = 'Authentication error: Could not find the ii-access.json file.';
        } else if (error.message.includes('Invalid table name')) {
            errorMessage = 'Invalid client ID format.';
        } else {
            // Include the actual error message for debugging
            errorMessage = `Server error: ${error.message}`;
        }
    }
    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
