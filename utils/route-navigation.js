import axios from 'axios';
import { JSDOM } from 'jsdom';

const performLinking = async (from, to) => {
  // Step 1: Fetch the initial page
  const response = await axios.get(from);
  const dom = new JSDOM(response.data);
  const document = dom.window.document;

  // Step 2: Extract the URL from the button's link or form
  const buttonLink = document.querySelector('.button-selector').getAttribute('href');
  const nextPageUrl = new URL(buttonLink).href; // Resolve relative URL
  console.log('Next Page URL:', nextPageUrl);

  // Step 3: Fetch the next page directly
  const nextPageResponse = await axios.get(nextPageUrl);
  console.log('Next Page Content:', nextPageResponse.data);
};

export default performLinking;
