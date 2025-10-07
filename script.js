// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000',
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

// Fetch result from local backend API
async function fetchResult(email) {
    const errorElement = document.getElementById('error');
    try {
        errorElement.innerHTML = '<p style="color: #666; font-size: 0.9em;">DEBUG INFO:</p>';
        errorElement.classList.remove('hidden');
        
        const appendLog = (message) => {
            errorElement.innerHTML += `<p style="color: #666; font-size: 0.9em;">${message}</p>`;
        };

        const url = `${API_CONFIG.BASE_URL}/api/result?email=${encodeURIComponent(email)}`;
        appendLog(`Fetching results for email: ${email}`);
        appendLog(`Using URL: ${url}`);
        
        const response = await fetch(url);
        const responseText = await response.text();
        appendLog(`Response status: ${response.status}`);

        if (!response.ok) {
            throw new Error(`API request failed (${response.status}): ${responseText}`);
        }

        const data = JSON.parse(responseText);
        if (data.result) {
            appendLog(`✓ Found result: ${data.result}`);
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
