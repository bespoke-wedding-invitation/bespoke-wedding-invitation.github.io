// Configuration
const CONFIG = {
    SHEET_ID: '1seZkg6XZfHTpnSWmQhmJtmugtkJ5BrJ9pnoLuxU9TmM',
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzy23w1QXdTcTWebLEqfq7zcr6NMpkmd3BApSQQWSuOGXvbVXZaD-cRMZ_TUq3LHsFJDA/exec'
};

// Guest data from URL
let currentGuest = null;
let isLoadingGuest = false;

// Music Control
const bgMusic = document.getElementById('bgMusic');
const musicControl = document.getElementById('musicControl');
let isMusicPlaying = false;

// Parse guest name from URL on page load
function initializeGuest() {
    let guestId = null;
    
    // Try hash-based routing: /#/aaron
    if (window.location.hash) {
        guestId = window.location.hash.replace('#/', '').split('?')[0].trim();
    }
    
    // Try query parameter: ?guest=aaron
    if (!guestId) {
        const params = new URLSearchParams(window.location.search);
        guestId = params.get('guest');
    }
    
    if (guestId) {
        // URL parameter detected (e.g., /#/aaron or ?guest=aaron)
        loadGuestData(guestId);
    }
}

// Fetch guest data from Google Sheets via Apps Script
async function loadGuestData(guestIdParam) {
    isLoadingGuest = true;
    disableForm(true);
    
    try {
        console.log('Loading guest data for:', guestIdParam);
        
        // Use Apps Script to fetch guest data
        const requestBody = {
            action: 'getGuestData',
            id: guestIdParam
        };
        
        console.log('Sending request to Apps Script:', requestBody);
        
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data && data.found) {
            currentGuest = {
                id: guestIdParam,
                name: data.name,
                allowedPax: parseInt(data.allowedPax) || 0
            };
            console.log('Guest loaded successfully:', currentGuest);
        } else {
            console.log('Guest not found in sheet');
        }
    } catch (error) {
        console.error('Error loading guest data:', error);
    } finally {
        isLoadingGuest = false;
        disableForm(false);
        updateGuestName();
        updatePaxOptions();
    }
}

// Update PAX options based on guest's allowed PAX
function updatePaxOptions() {
    const paxSelect = document.getElementById('guestPax');
    
    if (currentGuest && currentGuest.allowedPax > 0) {
        // Clear existing options except the placeholder
        paxSelect.innerHTML = '<option value="">Number of guests</option>';
        
        // Add options from 1 to allowedPax
        for (let i = 1; i <= currentGuest.allowedPax; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            paxSelect.appendChild(option);
        }
    } else {
        // Reset to placeholder only
        paxSelect.innerHTML = '<option value="">Number of guests</option>';
    }
}

// Update PAX options based on guest's allowed PAX
function updateGuestName() {
    const guestName = document.getElementById('guestName');
    
    if (currentGuest && currentGuest.allowedPax > 0) {
        // Clear existing options except the placeholder
        guestName.value = currentGuest.name;
    }
}

// Disable/enable form during loading
function disableForm(disabled) {
    const form = document.querySelector('.rsvp-form');
    if (form) {
        const inputs = form.querySelectorAll('input, select, button[type="submit"]');
        inputs.forEach(input => {
            input.disabled = disabled;
        });
    }
}

function toggleMusic() {
    if (isMusicPlaying) {
        bgMusic.pause();
        musicControl.textContent = '🔇';
        isMusicPlaying = false;
    } else {
        bgMusic.play().catch(err => console.log('Autoplay prevented:', err));
        musicControl.textContent = '🎵';
        isMusicPlaying = true;
    }
}

// Open Invitation
function openInvitation() {
    const coverPage = document.getElementById('coverPage');
    const mainContent = document.getElementById('mainContent');
    
    coverPage.classList.add('hidden');
    
    setTimeout(() => {
        mainContent.classList.add('visible');
        
        // Prefill guest name if available
        if (currentGuest) {
            document.getElementById('guestName').value = currentGuest.name;
            document.getElementById('guestName').readOnly = true;
            updatePaxOptions();
        }
        
        // Try to play music
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            musicControl.textContent = '🎵';
        }).catch(err => {
            console.log('Autoplay prevented:', err);
            musicControl.textContent = '🔇';
        });
    }, 100);

    // Load data from Google Sheets (if configured)
    loadInvitationData();
}

// Load data from Google Sheets
async function loadInvitationData() {
    // If you want to use Google Sheets, uncomment and configure:
    /*
    try {
        const sheetRange = 'Sheet1!A1:B20';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${sheetRange}?key=${CONFIG.API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values) {
            const dataMap = {};
            data.values.forEach(row => {
                if (row[0]) {
                    dataMap[row[0].toLowerCase().trim()] = row[1] || '';
                }
            });
            
            document.getElementById('groomName').textContent = dataMap['groom name'] || 'Groom Name';
            document.getElementById('brideName').textContent = dataMap['bride name'] || 'Bride Name';
            document.getElementById('eventDate').textContent = dataMap['event date'] || 'January 15, 2025';
            document.getElementById('eventTime').textContent = dataMap['event time'] || '4:00 PM - 11:00 PM';
            document.getElementById('eventVenue').textContent = dataMap['event venue'] || 'Grand Ballroom, City Name';
        }
    } catch (error) {
        console.log('Using default data');
    }
    */
}

// Submit RSVP
async function submitRSVP(event) {
    event.preventDefault();
    
    const name = document.getElementById('guestName').value;
    const attendance = document.getElementById('guestAttendance').value;
    const pax = document.getElementById('guestPax').value;

    try {
        // Send to Google Sheets
        await sendToGoogleSheets(currentGuest.id, name, attendance, pax);
        alert(`Thank you ${name}! Your RSVP has been recorded.\n\nAttendance: ${attendance}\nGuests: ${pax}`);
        event.target.reset();
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        alert('There was an error submitting your RSVP. Please try again.');
    }
}

// Send data to Google Sheets via Google Apps Script
async function sendToGoogleSheets(id, name, attendance, pax) {
    const requestBody = {
        id: id,
        name: name,
        attendance: attendance,
        pax: pax
    };
    
    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to submit RSVP: ${response.statusText}`);
    }
    
    return response.json();
}

// Share Invitation
function shareInvite() {
    if (navigator.share) {
        navigator.share({
            title: 'Wedding Invitation',
            text: 'You\'re invited to our wedding!',
            url: window.location.href
        }).catch(err => console.log('Share cancelled'));
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Invitation link copied to clipboard!');
        }).catch(() => {
            alert('Share this link: ' + window.location.href);
        });
    }
}

// Prevent horizontal scroll
document.body.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeGuest();
});