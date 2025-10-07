import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configure CORS with specific options
app.use(cors({
  origin: '*', // In production, you should configure this to your specific domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Set JSON content type for all API responses
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

app.use(express.static(__dirname)); // Serve static files from current directory
const PORT = 3000;

// Your Lark API info
const API_CONFIG = {
  APP_ID: "cli_a85633f4cbf9d028",
  APP_SECRET: "DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW",
  APP_TOKEN: "V1VKbIAasakzuAsD4x0lObgKgQc",
  TABLE_ID: "tblMhTzRqOPlesg3",
  VIEW_ID: "vewuuxuOFc",
  EMAIL_FIELD: "Email",                // Matches exactly with your Lark Base column name
  RESULT_FIELD: "Result",              // Matches exactly with your Lark Base column name
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

// Debug endpoint to list all records
app.get("/api/list-records", async (req, res) => {
  try {
    console.log('Getting tenant access token...');
    const token = await getTenantAccessToken();
    console.log('Token obtained successfully');

    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${API_CONFIG.APP_TOKEN}/tables/${API_CONFIG.TABLE_ID}/records`;
    console.log('Requesting data from URL:', url);

    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Records found:', data.data?.items?.length || 0);
    
    // Send the response with formatted JSON
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
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
    const token = await getTenantAccessToken();
    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${API_CONFIG.APP_TOKEN}/tables/${API_CONFIG.TABLE_ID}/records`;
    
    console.log('Fetching data for email:', email);
    console.log('URL:', url);

    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw response data:', JSON.stringify(data, null, 2));

    if (!data.data || !data.data.items) {
      throw new Error('Invalid response format from Lark API');
    }

    console.log(`Found ${data.data.items.length} records`);
    
    // Log all records for debugging
    data.data.items.forEach((item, index) => {
      console.log(`Record ${index + 1}:`, item.fields);
    });

    const record = data.data.items.find(item => {
      const recordEmail = item.fields[API_CONFIG.EMAIL_FIELD];
      console.log('Comparing:', recordEmail, 'with:', email);
      // Case-insensitive comparison
      return recordEmail && recordEmail.toLowerCase() === email.toLowerCase();
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
