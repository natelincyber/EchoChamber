document.getElementById('scrapeBtn').addEventListener('click', () => {
    const status = document.getElementById('status');
    status.textContent = "Scraping... (check console)";

    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs[0] || !tabs[0].url.includes('twitter.com') && !tabs[0].url.includes('x.com')) {
        status.textContent = "Error: Must be on Twitter/X.com";
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, {action: "scrape"}, (response) => {
        if (chrome.runtime.lastError) {
          status.textContent = "Error: " + chrome.runtime.lastError.message;
          console.error(chrome.runtime.lastError);
        } else {
          status.textContent = `Found ${response?.count || 0} tweets`;
          console.log('Popup received response:', response);
        }
      });
    });
  });

document.getElementById('continuousBtn').addEventListener('click', () => {
  const status = document.getElementById('status');
  status.textContent = "Scraping... (check console)";
  
  document.getElementById("continuousBtn").style.display = 'none';
  document.getElementById("stopContinuousBtn").style.display = 'block';
  

  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (!tabs[0] || !tabs[0].url.includes('twitter.com') && !tabs[0].url.includes('x.com')) {
      status.textContent = "Error: Must be on Twitter/X.com";
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, {action: "startContinuous"}, (response) => {
      if (chrome.runtime.lastError) {
        status.textContent = "Error: " + chrome.runtime.lastError.message;
        console.error(chrome.runtime.lastError);
      } else {
        status.textContent = `Found ${response?.count || 0} tweets`;
        console.log('Popup received response:', response);
      }
    });
  });
});

document.getElementById('stopContinuousBtn').addEventListener('click', () => {
  const status = document.getElementById('status');
  status.textContent = "Scraping... (check console)";
  document.getElementById("continuousBtn").style.display = 'block';
  document.getElementById("stopContinuousBtn").style.display = 'none';
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (!tabs[0] || !tabs[0].url.includes('twitter.com') && !tabs[0].url.includes('x.com')) {
      status.textContent = "Error: Must be on Twitter/X.com";
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, {action: "stopContinuous"}, (response) => {
      if (chrome.runtime.lastError) {
        status.textContent = "Error: " + chrome.runtime.lastError.message;
        console.error(chrome.runtime.lastError);
      } else {
        status.textContent = `Found ${response?.count || 0} tweets`;
        console.log('Popup received response:', response);
      }
    });
  });
});