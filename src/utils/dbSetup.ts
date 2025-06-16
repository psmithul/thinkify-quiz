export async function setupPaymentDatabase() {
  try {
    console.log('🔧 Starting database setup...');
    
    const response = await fetch('/api/setup-payment-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (result.success && result.tableExists) {
      console.log('✅ Database setup completed successfully');
      return { success: true, message: result.message };
    } else if (result.setupInstructions) {
      console.error('❌ Database setup required - table does not exist');
      console.log('📋 Setup Instructions:', result.setupInstructions);
      
      // Copy SQL to clipboard if possible
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(result.setupInstructions);
          console.log('📋 SQL copied to clipboard');
        } catch (err) {
          console.warn('Could not copy to clipboard:', err);
        }
      }
      
      return { 
        success: false, 
        error: result.error, 
        details: result.details,
        setupInstructions: result.setupInstructions,
        requiresManualSetup: true
      };
    } else {
      console.error('❌ Database setup failed:', result.error);
      return { 
        success: false, 
        error: result.error, 
        details: result.details
      };
    }
  } catch (error) {
    console.error('❌ Database setup request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper function to run setup and show instructions
export async function setupAndReload() {
  const result = await setupPaymentDatabase();
  
  if (result.success) {
    console.log('🔄 Reloading page to apply changes...');
    window.location.reload();
  } else if (result.requiresManualSetup) {
    // Show a detailed modal with SQL instructions
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 800px; max-height: 80vh; overflow-y: auto;">
          <h2 style="margin-top: 0; color: #dc3545;">Database Setup Required</h2>
          <p>The payment verification table does not exist. Please follow these steps:</p>
          <ol>
            <li>Open your <strong>Supabase Dashboard</strong></li>
            <li>Go to the <strong>SQL Editor</strong></li>
            <li>Copy and paste the SQL below:</li>
          </ol>
          <textarea readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 12px; margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">${result.setupInstructions}</textarea>
          <div style="margin-top: 15px;">
            <button onclick="navigator.clipboard?.writeText(\`${result.setupInstructions?.replace(/`/g, '\\`')}\`); alert('SQL copied to clipboard!')" style="background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; margin-right: 10px; cursor: pointer;">Copy SQL</button>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #6c757d; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    console.error('Setup failed:', result.error);
    alert(`Database setup failed: ${result.error}`);
  }
  
  return result;
} 