// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000',
    APP_ID: 'cli_a85633f4cbf9d028',
    APP_SECRET: 'DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW',
    APP_TOKEN: 'V1VKbIAasakzuAsD4x0lObgKgQc',
    TABLE_ID: 'tblMhTzRqOPlesg3',
    VIEW_ID: 'vewuuxuOFc',
    EMAIL_FIELD: 'Email',
    RESULT_FIELD: 'Result'
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

// No longer need the getTenantAccessToken function as we're using our local backend

// Helper function for logging debug messages
function appendLog(message) {
    const errorElement = document.getElementById('error');
    if (errorElement) {
        errorElement.innerHTML += `<p style="color: #666; font-size: 0.9em;">${message}</p>`;
    }
}

// Fetch result from local backend API
async function fetchResult(email) {
    const errorElement = document.getElementById('error');
    try {
        errorElement.innerHTML = '<p style="color: #666; font-size: 0.9em;">DEBUG INFO:</p>';
        errorElement.classList.remove('hidden');

        const url = `${API_CONFIG.BASE_URL}/api/result?email=${encodeURIComponent(email)}`;
        appendLog(`Fetching results for email: ${email}`);
        appendLog(`Using URL: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                appendLog(`❌ No results found for email: ${email}`);
                return null;
            }
            throw new Error(`API request failed (${response.status})`);
        }

        const data = await response.json();
        appendLog(`Response status: ${response.status}`);
        
        if (data.result) {
            appendLog(`✓ Found result for ${email}: ${data.result}`);
            errorElement.classList.add('hidden');
            return data.result;
        }
        
        appendLog(`❌ No results found for email: ${email}`);
        return null;
    } catch (error) {
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
    const errorElement = document.getElementById('error');
    const loadingElement = document.getElementById('loading');
    
    if (!email) {
        errorElement.textContent = "No email provided.";
        errorElement.classList.remove('hidden');
        loadingElement.classList.add('hidden');
        return;
    }

    errorElement.textContent = `Loading...`;
    errorElement.classList.remove('hidden');

    try {
        loadingElement.classList.remove('hidden');
        const house = await fetchResult(email);
        
        if (house) {
            showResult(house);
            setupShareButton(house);
            errorElement.classList.add('hidden');
        } else {
            loadingElement.classList.add('hidden');
            errorElement.classList.remove('hidden');
            errorElement.innerHTML = `
                <p>No results found for ${email}</p>
                <p class="error-details">Please check that:</p>
                <ul>
                    <li>The email address is spelled correctly</li>
                    <li>You have completed the sorting quiz</li>
                    <li>The results have been processed (this may take a few minutes)</li>
                </ul>
            `;
        }
    } catch (error) {
        loadingElement.classList.add('hidden');
        errorElement.classList.remove('hidden');
        errorElement.innerHTML = `
            <p>Error: Unable to retrieve data</p>
            <p class="error-details">Please try again in a few moments. If the problem persists, contact support.</p>
            <p class="error-technical">${error.message}</p>
        `;
        console.error('Error:', error);
    }
}

// Start the application
init();
