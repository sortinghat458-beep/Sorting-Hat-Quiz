// API Configuration
const API_CONFIG = {
    APP_ID: 'cli_a85633f4cbf9d028',
    APP_SECRET: 'DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW',
    BASE_URL: 'https://hsglgzblfc5f.sg.larksuite.com/open-apis/bitable/v1',
    APP_TOKEN: 'V1VKbIAasakzuAsD4x0lObgKgQc',
    TABLE_ID: 'tblMhTzRqOPlesg3',
    VIEW_ID: 'vewuuxuOFc',
    EMAIL_FIELD: 'Email',  // Using exact field name from Lark Base
    RESULT_FIELD: 'Result'  // Using exact field name from Lark Base
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
        
        // Construct URL with exact field names
        const url = `${API_CONFIG.BASE_URL}/apps/${API_CONFIG.APP_TOKEN}/tables/${API_CONFIG.TABLE_ID}/records?view=${API_CONFIG.VIEW_ID}&filter=CurrentValue.[${API_CONFIG.EMAIL_FIELD}]="${email}"`;
        appendLog(`Fetching results for email: ${email}`);
        appendLog(`Using URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tenantAccessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const responseText = await response.text();
        appendLog(`Response status: ${response.status}`);

        if (!response.ok) {
            throw new Error(`API request failed (${response.status}): ${responseText}`);
        }

        const data = JSON.parse(responseText);
        appendLog(`Records found: ${data.data?.total || 0}`);
        
        // Check if we have any records
        if (data.data?.items?.[0]) {
            const fields = data.data.items[0].fields;
            appendLog('Available fields: ' + Object.keys(fields).join(', '));
            
            // Get result from the Result field
            const result = fields[API_CONFIG.RESULT_FIELD];
            if (!result) {
                throw new Error(`No '${API_CONFIG.RESULT_FIELD}' field found in response. Available fields: ${Object.keys(fields).join(', ')}`);
            }
            appendLog(`✓ Found result: ${result}`);
            errorElement.classList.add('hidden');
            return result;
        }
        
        appendLog(`❌ No records found for email: ${email}`);
        return null;
        
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
