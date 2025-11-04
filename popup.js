// popup.js

const analyticsList = document.getElementById('analytics-list');
const resetButton = document.getElementById('reset-button');

// Helper function to format seconds into HH:MM:SS
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

function renderAnalytics(data) {
    analyticsList.innerHTML = ''; // Clear existing list
    
    if (Object.keys(data).length === 0) {
        analyticsList.innerHTML = '<li>No activity tracked yet.</li>';
        return;
    }

    // Sort the data by time spent (descending)
    const sortedData = Object.entries(data).sort(([, timeA], [, timeB]) => timeB - timeA);

    sortedData.forEach(([domain, timeSpent]) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = <span class="domain">${domain}</span><span class="time">${formatTime(timeSpent)}</span>;
        analyticsList.appendChild(listItem);
    });
}

// 1. Request data from the background script when the popup is opened
function loadData() {
    chrome.runtime.sendMessage({ action: "request_data" }, (response) => {
        if (response && response.data) {
            renderAnalytics(response.data);
        } else {
            analyticsList.innerHTML = '<li>Error loading data.</li>';
        }
    });
}

// 2. Handle the Reset button click
resetButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all tracking data?')) {
        // Clear data in Chrome storage
        chrome.storage.local.remove('trackingData', () => {
            // Send a message to the background script to clear its in-memory data
            chrome.runtime.sendMessage({ action: "reset_data" }, (response) => {
                 // Reload the UI to reflect the reset
                 loadData(); 
            });
        });
    }
});

// Since the popup doesn't have direct access to the background variables, 
// we also need to add a small handler in background.js for the reset action.
// (This is a simplified approach)
/* // ADD TO background.js:
    if (request.action === "reset_data") {
        trackingData = {}; // Clear in-memory data
        // No need to send response as chrome.storage.local.remove already handles persistence
    }
*/

// Initial data load
loadData();
