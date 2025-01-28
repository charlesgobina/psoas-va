import axios from 'axios';
import * as cheerio from "cheerio";
import { readFile } from 'fs/promises';
import path from 'path';

async function scrapeAddresses(url) {
  try {
    // Fetch the HTML content of the page
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Load the HTML into Cheerio
    const $ = cheerio.load(data);


    // Use a Set to remove duplicates
    const addresses = new Set();

    // More specific selector to target the exact span
    $('.card-huoneisto__summary__osoite > span[onclick]').each((index, element) => {
      
      // Extract and trim the text
      const address = $(element).text().trim();
      
      // Add to addresses set if not empty
      if (address) {
        addresses.add(address);
      }
    });
    return addresses;
  } catch (error) {
    console.error('Error scraping addresses:', error.message);
    return [];
  }
}

// Example usage
async function main() {
  const url = 'https://www.psoas.fi/en/locations/'; // Replace with the actual URL
  const addresses = await scrapeAddresses(url);
  
  console.log('Scraped Addresses:', addresses);
}

const readAddressesFromFile = async (filePath) => {
  try {
    // Read the file contents
    const fileContents = await readFile(filePath, 'utf8');
    
    // Split the contents by newline and process
    const addresses = fileContents
      .split('\n')
      .map(address => address.trim()) // Remove leading/trailing whitespace
      .filter(Boolean); // Remove empty lines (ES6 shorthand for non-empty strings)
    
    return addresses;
  } catch (error) {
    console.error('Error reading addresses file:', error);
    return [];
  }
};

// Uncomment the line below to run the script
// main();

export { scrapeAddresses, readAddressesFromFile };