console.log('Twitter Scraper Pro - Content Script Loaded');

// Configuration
const config = {
  maxTweets: 1000, // Safety limit
  scrapeInterval: 1000, // For continuous scraping
  includeEngagement: true,
  includeMediaInfo: true,
  includeUserInfo: true
};

// State
let scrapingActive = false;
let scrapeIntervalId = null;
let collectedTweets = new Map(); // Using Map to prevent duplicates by tweet ID

// Main scraping function
function scrapeTweets(options = {}) {
  console.log('Starting tweet scraping...');
  const tweets = [];
  const tweetElements = document.querySelectorAll('article[data-testid="tweet"]:not([data-scraped])');
  
  tweetElements.forEach((tweetEl, index) => {
    try {
      // Mark as scraped to avoid duplicates
      tweetEl.setAttribute('data-scraped', 'true');
      
      const textEl = tweetEl.querySelector('[data-testid="tweetText"]');
      if (!textEl) return;
      
      const tweetData = {
        id: tweetEl.getAttribute('aria-labelledby') || `temp-${Date.now()}-${index}`,
        text: textEl.innerText,
        handle: tweetEl.querySelector('a[href^="/"]')?.getAttribute('href')?.slice(1) || 'unknown',
        time: tweetEl.querySelector('time')?.getAttribute('datetime') || 'unknown',
        url: window.location.href
      };

      // Additional data collection
      if (config.includeEngagement) {
        tweetData.engagement = {
          likes: getEngagementCount(tweetEl, 'like'),
          retweets: getEngagementCount(tweetEl, 'retweet'),
          replies: getEngagementCount(tweetEl, 'reply'),
          views: getEngagementCount(tweetEl, 'view')
        };
      }

      if (config.includeMediaInfo) {
        tweetData.media = {
          hasImage: tweetEl.querySelector('[data-testid="tweetPhoto"]') !== null,
          hasVideo: tweetEl.querySelector('[data-testid="videoPlayer"]') !== null,
          hasGif: tweetEl.querySelector('[data-testid="tweetGif"]') !== null
        };
      }

      if (config.includeUserInfo) {
        const userEl = tweetEl.querySelector('[data-testid="User-Name"]');
        if (userEl) {
          tweetData.user = {
            name: userEl.textContent.split('@')[0].trim(),
            verified: tweetEl.querySelector('[data-testid="icon-verified"]') !== null
          };
        }
      }

      // Add to collection if not already present
      if (!collectedTweets.has(tweetData.id)) {
        collectedTweets.set(tweetData.id, tweetData);
        tweets.push(tweetData);
      }
    } catch (e) {
      console.error('Error scraping tweet:', e);
    }
  });
  
  console.log(`Scraped ${tweets.length} new tweets`);
  return tweets;
}

// Helper function to get engagement counts
function getEngagementCount(tweetEl, type) {
  const selector = {
    like: '[data-testid="like"]',
    retweet: '[data-testid="retweet"]',
    reply: '[data-testid="reply"]',
    view: '[data-testid="view"]'
  }[type];
  
  const el = tweetEl.querySelector(selector);
  if (!el) return 0;
  
  const countText = el.getAttribute('aria-label') || '';
  const match = countText.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

// Continuous scraping
function startContinuousScraping() {
  if (scrapingActive) return;
  
  scrapingActive = true;
  console.log('Starting continuous scraping...');
  
  // Initial scrape
  const initialTweets = scrapeTweets();
  console.log(`Found ${initialTweets.length} tweets initially`);
  
  // Set up interval
  scrapeIntervalId = setInterval(() => {
    const newTweets = scrapeTweets();
    if (newTweets.length > 0) {
      console.log(`Found ${newTweets.length} new tweets during continuous scraping`);
      // Could send to background script here if needed
    }
  }, config.scrapeInterval);
}

function stopContinuousScraping() {
  if (!scrapingActive) return;
  
  scrapingActive = false;
  clearInterval(scrapeIntervalId);
  console.log('Stopped continuous scraping');
}

// Export collected data
function exportCollectedData(format = 'json') {
  const data = Array.from(collectedTweets.values());
  
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else if (format === 'csv') {
    return convertToCSV(data);
  }
  return data;
}

function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  let csv = headers.join(',') + '\n';
  
  data.forEach(tweet => {
    const row = headers.map(header => {
      let value = tweet[header];
      
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request.action);
  switch (request.action) {
    
    case "scrape":
      const tweets = scrapeTweets();
      sendResponse({
        success: true, 
        count: tweets.length, 
        tweets: tweets,
        totalCollected: collectedTweets.size
      });
      break;
      
    case "startContinuous":
      startContinuousScraping();
      sendResponse({ success: true, status: "continuous scraping started" });
      break;
      
    case "stopContinuous":
      stopContinuousScraping();
      sendResponse({ success: true, status: "continuous scraping stopped" });
      break;
      
    case "exportData":
      const format = request.format || 'json';
      const data = exportCollectedData(format);
      sendResponse({ success: true, format, data });
      break;
      
    case "getStats":
      sendResponse({
        success: true,
        stats: {
          totalCollected: collectedTweets.size,
          lastScraped: new Date().toISOString(),
          config
        }
      });
      break;
      
    default:
      sendResponse({ success: false, error: "Unknown action" });
  }
  
  return true; // Keep message channel open for async responses
});

// Initialization
console.log('Twitter Scraper Pro initialized');