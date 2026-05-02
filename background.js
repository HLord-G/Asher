// background.js

chrome.alarms.create("keepAlive", {
    periodInMinutes: 1
  });
  
  chrome.alarms.onAlarm.addListener(async () => {
  
    const tabs = await chrome.tabs.query({
      url: "*://www.tumblr.com/*"
    });
  
    for (const tab of tabs) {
  
      chrome.tabs.sendMessage(tab.id, {
        action: "keepRunning"
      });
  
    }
  
  });