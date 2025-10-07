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
    const errorElement = document.getElementById('error');
    const loadingElement = document.getElementById('loading');
    
    if (!email) {
        errorElement.innerHTML = `
            <div class="welcome-message">
                <h2>Welcome to the Sorting Hat Quiz!</h2>
                <p>To discover your HR house, please:</p>
                <ol>
                    <li>Complete the quiz form first</li>
                    <li>Your results will appear here automatically after submission</li>
                </ol>
                <p><a href="https://hsglgzblfc5f.sg.larksuite.com/base/V1VKbIAasakzuAsD4x0lObgKgQc?table=tblMhTzRqOPlesg3&view=vewuuxuOFc" 
                      style="color: #740001; text-decoration: underline; font-weight: bold;">
                      Click here to take the quiz!</a></p>
            </div>`;
        errorElement.classList.remove('hidden');
        loadingElement.classList.add('hidden');
        return;
    }

    errorElement.textContent = `🎩 The Sorting Hat is considering your answers...`;
    errorElement.classList.remove('hidden');

    try {
        const house = await fetchResult(email);
        if (house) {
            showResult(house);
            setupShareButton(house);
        } else {
            errorElement.innerHTML = `
                <div class="result-pending">
                    <h2>Your Result Is Being Processed</h2>
                    <p>The Sorting Hat is still contemplating your answers. This usually takes just a moment.</p>
                    <p>Please try again in a few seconds by refreshing this page.</p>
                    <p>If you haven't taken the quiz yet, 
                        <a href="https://hsglgzblfc5f.sg.larksuite.com/base/V1VKbIAasakzuAsD4x0lObgKgQc?table=tblMhTzRqOPlesg3&view=vewuuxuOFc" 
                           style="color: #740001; text-decoration: underline; font-weight: bold;">
                           click here to take it now!</a>
                    </p>
                </div>`;
        }
    } catch (error) {
        errorElement.innerHTML = `
            <div class="error-message">
                <h2>Oops! Something went wrong</h2>
                <p>The Sorting Hat encountered an unexpected situation.</p>
                <p>Please try refreshing the page or take the quiz again.</p>
                <p><a href="https://hsglgzblfc5f.sg.larksuite.com/base/V1VKbIAasakzuAsD4x0lObgKgQc?table=tblMhTzRqOPlesg3&view=vewuuxuOFc" 
                      style="color: #740001; text-decoration: underline; font-weight: bold;">
                      Click here to take the quiz!</a></p>
            </div>`;
        console.error('Error:', error);
    }
}

// Start the application
init();
