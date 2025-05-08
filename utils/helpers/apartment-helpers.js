const extractLocation = (url) => {
  const match = url.match(/\/locations\/([^/]+)/);
  return match ? match[1] : null;
};

const extractSpecificSlug = (url) => {
  // Find the index of "/apartment/" in the URL
  const apartmentIndex = url.indexOf("/apartment/");

  // If "/apartment/" is found, extract everything after it
  if (apartmentIndex !== -1) {
    const pathAfterApartment = url.slice(apartmentIndex + "/apartment/".length);

    // Remove the trailing slash if it exists
    return pathAfterApartment.endsWith("/")
      ? pathAfterApartment.slice(0, -1)
      : pathAfterApartment;
  }

  // If "/apartment/" is not found, return null or an empty string
  return null;
};

const extractPrice = (priceString) => {
  // Extract just the numeric part before any text like "/ month"
  const numericPart = priceString.split('/')[0];
  
  // Remove the euro sign and any whitespace
  const cleanedString = numericPart.replace('€', '').trim();
  
  // Parse as float and validate
  const price = parseFloat(cleanedString);
  if (isNaN(price)) {
    throw new Error("Invalid price format");
  }
  
  // Return the price as a float instead of string
  return price;
};

const extractRooms = (roomsString) => {
  if (roomsString === "") {
    return 0; // Return 0 if the string is empty
  }

  // Finnish format like "1h+kk", extract the number at the beginning
  const match = roomsString.match(/^(\d+)/);
  
  if (match && match[1]) {
    return parseInt(match[1], 10); // Convert to integer
  } else {
    throw new Error("Invalid rooms format");
  }
};

const extractSize = (sizeString) => {
  if (!sizeString || typeof sizeString !== 'string') {
    return 0; // Return 0 for empty input or non-string input
  }
  
  // Replace comma with period for decimal point
  const cleanedString = sizeString.replace(',', '.');
  
  // Parse as float and validate
  const size = parseFloat(cleanedString);
  if (isNaN(size)) {
    throw new Error("Invalid size format");
  }
  
  return size;
};

export { extractLocation, extractSpecificSlug, extractPrice, extractRooms, extractSize };
