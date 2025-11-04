// background.js

const TRACKING_INTERVAL_MS = 5000; // Check every 5 seconds
let lastTrackedUrl = null;
let trackingData = {}; // Stores { 'url': totalTimeInSeconds }

// Function to get the URL of the currently active tab
async function getActiveTabUrl() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tabs.length > 0) {
    // We only track http/https pages, not chrome:// pages or new tab pages
    if (tabs[0].url && (tabs[0].url.startsWith('http') || tabs[0].url.startsWith('https'))) {
      // Use the hostname (domain) for analytics
      const url = new URL(tabs[0].url);
      return url.hostname;
    }
  }
  return null;
}

// Core time tracking function
async function trackTime() {
  const currentUrl = await getActiveTabUrl();

  if (lastTrackedUrl) {
    // Record time for the previous active URL
    trackingData[lastTrackedUrl] = (trackingData[lastTrackedUrl] || 0) + (TRACKING_INTERVAL_MS / 1000);
    
    // Save data to Chrome local storage every time an update occurs
    chrome.storage.local.set({ 'trackingData': trackingData });
  }

  // Update the current tracking state
  lastTrackedUrl = currentUrl;

  console.log(Tracking: ${lastTrackedUrl} | Total time: ${trackingData[lastTrackedUrl] || 0}s);
}

// 1. Initialize and load data on extension startup
chrome.runtime.onInstalled.addListener(() => {
  // Load saved data from storage
  chrome.storage.local.get(['trackingData'], (result) => {
    if (result.trackingData) {
      trackingData = result.trackingData;
    }
    console.log('Tracking data loaded:', trackingData);
  });
  
  // Set up the alarm to trigger the tracking function periodically
  chrome.alarms.create('timeTracker', { periodInMinutes: TRACKING_INTERVAL_MS / 60000 });
});

// 2. Listener for the periodic alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timeTracker') {
    trackTime();
  }
});

// 3. Simple message listener for the Popup to request data
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "request_data") {
    // Send the current data to the popup
    sendResponse({ data: trackingData });
  }
});
