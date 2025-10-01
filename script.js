// API Configuration
const API_CONFIG = {
    APP_ID: 'cli_a85633f4cbf9d028',
    APP_SECRET: 'DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW',
    BASE_URL: 'https://open.larksuite.com/open-apis/bitable/v1',
    APP_TOKEN: 'V1VKbIAasakzuAsD4x0lObgKgQc',
    TABLE_ID: 'tblMhTzRqOPlesg3',
    VIEW_ID: 'vewuuxuOFc',
    EMAIL_FIELD: 'email',
    HOUSE_FIELD: 'house'
};

// House configurations
const HOUSES = {
    'GryffinHR': {
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

// DOM Elements
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
    try {
        const tenantAccessToken = await getTenantAccessToken();
        
        // Construct the URL with query parameters
        const url = `${API_CONFIG.BASE_URL}/apps/${API_CONFIG.APP_TOKEN}/tables/${API_CONFIG.TABLE_ID}/records?view=${API_CONFIG.VIEW_ID}&filter=CurrentValue.[${API_CONFIG.EMAIL_FIELD}]="${email}"`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tenantAccessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        
        // Check if we have any records
        if (data.data.total > 0 && data.data.items.length > 0) {
            // Return the house field from the first matching record
            return data.data.items[0].fields[API_CONFIG.HOUSE_FIELD];
        }
        return null;
    } catch (error) {
        console.error('Error fetching result:', error);
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
