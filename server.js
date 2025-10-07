import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.static(__dirname)); // Serve static files from current directory
const PORT = 3000;

// Your Lark API info
const API_CONFIG = {
  APP_ID: "cli_a85633f4cbf9d028",
  APP_SECRET: "DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW",
  APP_TOKEN: "V1VKbIAasakzuAsD4x0lObgKgQc",
  TABLE_ID: "tblMhTzRqOPlesg3",
  VIEW_ID: "vewuuxuOFc",
  EMAIL_FIELD: "Email",
  RESULT_FIELD: "Result",
  BASE_URL: "https://open.larksuite.com/open-apis/bitable/v1"
};

// Get access token
async function getTenantAccessToken() {
  try {
    console.log('Attempting to get tenant access token...');
    console.log('Using App ID:', API_CONFIG.APP_ID);
    
    const response = await fetch("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: API_CONFIG.APP_ID,
        app_secret: API_CONFIG.APP_SECRET
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Failed to get access token:', data);
      throw new Error(`Failed to get access token: ${data.msg || 'Unknown error'}`);
    }

    console.log('✓ Successfully obtained access token');
    return data.tenant_access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Debug endpoint to see all records
app.get("/api/debug", async (req, res) => {
  try {
    const token = await getTenantAccessToken();
    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${API_CONFIG.APP_TOKEN}/tables/${API_CONFIG.TABLE_ID}/records?view_id=${API_CONFIG.VIEW_ID}`;
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy endpoint
// Test Lark Base connection
app.get("/api/test-connection", async (req, res) => {
  try {
    const token = await getTenantAccessToken();
    const url = `${API_CONFIG.BASE_URL}/apps/${API_CONFIG.APP_TOKEN}/tables/${API_CONFIG.TABLE_ID}/records?view_id=${API_CONFIG.VIEW_ID}`;
    
    console.log('Testing connection with URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    res.json({
      success: response.ok,
      status: response.status,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

app.get("/api/result", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    console.log(`\n[${new Date().toISOString()}] Getting result for email: ${email}`);
    const token = await getTenantAccessToken();
    console.log('✓ Access token obtained successfully');

    const url = `${API_CONFIG.BASE_URL}/apps/${API_CONFIG.APP_TOKEN}/tables/${API_CONFIG.TABLE_ID}/records?view_id=${API_CONFIG.VIEW_ID}`;
    console.log(`✓ Requesting data from Lark Base...`);
    console.log('URL:', url);

    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('✓ Received response from Lark Base');
    console.log('Debug - Available fields in first record:', data.data?.items?.[0]?.fields ? Object.keys(data.data.items[0].fields) : 'No records found');
    
    if (!data.data || !data.data.items) {
      console.error('❌ Invalid API response format');
      throw new Error('Invalid response format from Lark API');
    }

    console.log(`✓ Found ${data.data.items.length} records in table`);
    
    const record = data.data.items.find(item => {
      console.log(`Comparing email: "${item.fields[API_CONFIG.EMAIL_FIELD]}" with "${email}"`);
      return item.fields[API_CONFIG.EMAIL_FIELD] === email;
    });

    if (record) {
      const result = record.fields[API_CONFIG.RESULT_FIELD];
      console.log(`✓ Found result for ${email}: ${result}`);
      res.json({ result });
    } else {
      console.log(`❌ No result found for email: ${email}`);
      console.log('Available emails:', data.data.items.map(item => item.fields[API_CONFIG.EMAIL_FIELD]));
      res.status(404).json({ error: "Result not found" });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
