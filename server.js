import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

// Your Lark API info
const API_CONFIG = {
  APP_ID: "cli_a85633f4cbf9d028",
  APP_SECRET: "DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW",
  APP_TOKEN: "V1VKbIAasakzuAsD4x0lObgKgQc",
  TABLE_ID: "tblMhTzRqOPlesg3",
  EMAIL_FIELD: "Email",
  RESULT_FIELD: "Result"
};

// Get access token
async function getTenantAccessToken() {
  const response = await fetch("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: API_CONFIG.APP_ID,
      app_secret: API_CONFIG.APP_SECRET
    })
  });
  const data = await response.json();
  return data.tenant_access_token;
}

// Proxy endpoint
app.get("/api/result", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const token = await getTenantAccessToken();
    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${API_CONFIG.APP_TOKEN}/tables/${API_CONFIG.TABLE_ID}/records`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    const record = data.data.items.find(item => item.fields[API_CONFIG.EMAIL_FIELD] === email);

    if (record) {
      res.json({ result: record.fields[API_CONFIG.RESULT_FIELD] });
    } else {
      res.status(404).json({ error: "Result not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
