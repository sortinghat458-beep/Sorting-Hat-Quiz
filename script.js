// API Configuration
const API_CONFIG = {
    APP_ID: 'cli_a85633f4cbf9d028',
    APP_SECRET: 'DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW',
    BASE_URL: 'https://hsglgzblfc5f.sg.larksuite.com/open-apis/bitable/v1',
    APP_TOKEN: 'V1VKbIAasakzuAsD4x0lObgKgQc',
    TABLE_ID: 'tblMhTzRqOPlesg3',
    // Actual field names will be determined at runtime
    EMAIL_FIELD_LOWERCASE: 'email',
    RESULT_FIELD_LOWERCASE: 'result'
};

// House configurations
const HOUSES = {
    'GriffinHour': {
        class: 'gryffin-hr',
        emoji: '🦁'
    },
    'SlytherRoll': {
        class: 'slyther-roll',
        emoji: '🐍'
    },
    'RavenWork': {
        class: 'raven-work',
        emoji: '🦅'
    },
    'HuffleStaff': {
        class: 'huffle-staff',
        emoji: '🦡'
    }
};

// DOM Elementssss
const loadingElement = document.getElementById('loading');
const resultElement = document.getElementById('result');
const errorElement = document.getElementById('error');
const houseResultElement = document.getElementById('house-result');
const shareButton = document.getElementById('share-button');

// Get email from URL parameters
function getEmailFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('email');
}

// Get tenant access token
async function getTenantAccessToken() {
    try {
        const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "app_id": API_CONFIG.APP_ID,
                "app_secret": API_CONFIG.APP_SECRET
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get tenant access token');
        }

        const data = await response.json();
        return data.tenant_access_token;
    } catch (error) {
        console.error('Error getting tenant access token:', error);
        throw error;
    }
}

// Fetch result from Lark Base API
async function fetchResult(email) {
    const errorElement = document.getElementById('error');
    try {
        // Show debug info
        errorElement.innerHTML = '<p style="color: #666; font-size: 0.9em;">DEBUG INFO:</p>';
        errorElement.classList.remove('hidden');
        
        const appendLog = (message) => {
            errorElement.innerHTML += `<p style="color: #666; font-size: 0.9em;">${message}</p>`;
        };

        appendLog('Getting access token...');
        const tenantAccessToken = await getTenantAccessToken();
        if (!tenantAccessToken) {
            throw new Error('Failed to get access token');
        }
        appendLog('✓ Access token received');
        
        // First, get all records to discover field names
        const baseUrl = `${API_CONFIG.BASE_URL}/apps/${API_CONFIG.APP_TOKEN}/tables/${API_CONFIG.TABLE_ID}/records`;
        appendLog('Fetching table structure...');
        
        const initialResponse = await fetch(baseUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tenantAccessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!initialResponse.ok) {
            const errorText = await initialResponse.text();
            appendLog(`API Error (${initialResponse.status}): ${errorText}`);
            if (initialResponse.status === 403) {
                appendLog('⚠️ Permission denied. Check if app has bitable:app and bitable:table:read permissions');
            }
            throw new Error(`API request failed (${initialResponse.status})`);
        }

        const initialData = await initialResponse.json();
        
        if (!initialData.data?.items?.[0]) {
            appendLog('⚠️ Table appears to be empty');
            return null;
        }

        // Find exact field names (case-sensitive)
        const fields = initialData.data.items[0].fields;
        const fieldNames = Object.keys(fields);
        appendLog('Available fields: ' + fieldNames.join(', '));

        // Find exact email field name
        const emailField = fieldNames.find(f => 
            f.toLowerCase() === API_CONFIG.EMAIL_FIELD_LOWERCASE
        );
        if (!emailField) {
            throw new Error(`Email field not found. Looking for field containing '${API_CONFIG.EMAIL_FIELD_LOWERCASE}'. Available fields: ${fieldNames.join(', ')}`);
        }
        appendLog(`✓ Found email field: "${emailField}"`);

        // Now fetch with correct field name and filter
        const url = `${baseUrl}?filter=CurrentValue.[${emailField}]="${email}"`;
        appendLog(`Looking up email: ${email}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tenantAccessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Filtered query failed (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        appendLog(`Records found: ${data.data?.total || 0}`);
        
        if (data.data?.items?.[0]) {
            const record = data.data.items[0];
            const fields = record.fields;
            
            // Find exact result field name
            const resultField = Object.keys(fields).find(f => 
                f.toLowerCase() === API_CONFIG.RESULT_FIELD_LOWERCASE
            );
            
            if (!resultField) {
                throw new Error(`Result field not found. Looking for field containing '${API_CONFIG.RESULT_FIELD_LOWERCASE}'. Available fields: ${Object.keys(fields).join(', ')}`);
            }
            
            const result = fields[resultField];
            appendLog(`✓ Found result in field "${resultField}": ${result}`);
            errorElement.classList.add('hidden');
            return result;
        }
        
        appendLog(`❌ No records found for email: ${email}`);
        return null;
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            appendLog('❌ Network error - CORS issue detected. The Lark API cannot be called directly from browser.');
            appendLog('Solution: Set up a backend proxy server to make the API calls.');
        }
        appendLog(`❌ Error: ${error.message}`);
        return null;
    }
}

// Display the result
function showResult(house) {
    loadingElement.classList.add('hidden');
    
    if (!house || !HOUSES[house]) {
        errorElement.classList.remove('hidden');
        return;
    }

    const houseConfig = HOUSES[house];
    houseResultElement.textContent = `${houseConfig.emoji} You belong to ${house}!`;
    houseResultElement.className = `house-announcement ${houseConfig.class}`;
    resultElement.classList.remove('hidden');
}

// Share result functionality
function setupShareButton(house) {
    if (!house || !HOUSES[house]) return;

    shareButton.addEventListener('click', () => {
        const text = `🎉 The Sorting Hat has spoken! I belong to ${house} ${HOUSES[house].emoji}! Take the quiz to find your HR house!`;
        
        navigator.clipboard.writeText(text)
            .then(() => {
                shareButton.textContent = 'Copied!';
                setTimeout(() => {
                    shareButton.textContent = 'Share Result';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy:', err);
                shareButton.textContent = 'Failed to copy';
            });
    });
}

// Initialize the page
async function init() {
    const email = getEmailFromUrl();
    
    if (!email) {
        showResult(null);
        return;
    }

    const house = await fetchResult(email);
    showResult(house);
    
    if (house) {
        setupShareButton(house);
    }
}

// Start the application
init();
