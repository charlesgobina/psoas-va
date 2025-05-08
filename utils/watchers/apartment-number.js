import axios from 'axios';
import * as cheerio from 'cheerio';
import EventEmitter from 'events';
import { getVacancies, getVacantApartmentDetails, vacantApartmentLocations } from '../../controller/apartments/apartment-controller.js';

class WebsiteWatcher extends EventEmitter {
  constructor(url, options = {}) {
    super();
    this.url = url;
    this.interval = options.interval || 5 * 60 * 1000; // Default 5 minutes
    this.lastCount = null;
    this.timer = null;
    this.isWatching = false;
    this.userAgent = options.userAgent || 'Mozilla/5.0 ';
  }

  async getApartmentCount() {
    try {
      const response = await axios.get(this.url, {
        headers: {
          'User-Agent': this.userAgent
        }
      });

      const $ = cheerio.load(response.data);
      
      // NOTE: Update this selector based on your target website's HTML structure
      const apartmentElements = $('.huoneistohaku__lista__container');
      return apartmentElements.children('article').length;
    } catch (error) {
      throw new Error(`Failed to fetch website: ${error.message}`);
    }
  }

  async checkForChanges() {
    try {
      const currentCount = await this.getApartmentCount();
      
      // If this isn't the first check and the count has changed
      if (this.lastCount !== null && this.lastCount !== currentCount) {
        this.emit('change', {
          previousCount: this.lastCount,
          currentCount,
          timestamp: new Date()
        });
      }

      this.lastCount = currentCount;
    } catch (error) {
      this.emit('error', error);
    }
  }

  start() {
    if (this.isWatching) {
      return;
    }

    this.isWatching = true;
    console.log(`Starting watcher for ${this.url}`);
    
    // Perform initial check
    this.checkForChanges();
    
    // Set up periodic checks
    this.timer = setInterval(() => {
      this.checkForChanges();
    }, this.interval);

    this.emit('started');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isWatching = false;
    console.log(`Stopped watcher for ${this.url}`);
    this.emit('stopped');
  }

  // Method to change the check interval
  setInterval(newInterval) {
    this.interval = newInterval;
    if (this.isWatching) {
      this.stop();
      this.start();
    }
  }
}

// Utility function to create a rate-limited version of the watcher
function createRateLimitedWatcher(url, options = {}) {
  const watcher = new WebsiteWatcher(url, options);
  let lastCheckTime = 0;
  const minInterval = options.minInterval || 1000; // Minimum 1 second between requests

  // Override the getApartmentCount method to add rate limiting
  const originalGetApartmentCount = watcher.getApartmentCount.bind(watcher);
  watcher.getApartmentCount = async function() {
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime;
    if (timeSinceLastCheck < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastCheck));
    }
    
    lastCheckTime = Date.now();
    return originalGetApartmentCount();
  };

  return watcher;
}

// Example usage:
async function main() {
  const watcher = createRateLimitedWatcher('https://www.psoas.fi/en/apartments/?_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa', {
    interval: 1 * 60 * 1000,  // Check every 15 minutes
    minInterval: 5000,         // Minimum 5 seconds between requests
    userAgent: 'Custom User Agent String'
  });

  // Handle changes
  watcher.on('change', async ({ previousCount, currentCount, timestamp }) => {
    console.log(`Change detected at ${timestamp}`);
    console.log(`Apartments changed from ${previousCount} to ${currentCount}`);
    
    try {
      // Call your update functions here
      await vacantApartmentLocations();
      await getVacancies();
      console.log('await is non-blocking');
      await notifyUsers();
    } catch (error) {
      console.error('Error handling change:', error);
    }
  });

  // Handle errors
  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
  });

  // Start watching
  watcher.start();
}

async function updateDatabase() {
  // Your database update logic here
}

async function notifyUsers() {
  // Your notification logic here
}

main()

export { WebsiteWatcher, createRateLimitedWatcher };