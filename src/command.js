import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import open from "open";
import {
  ApartmentScraper
} from "../server.js";

// Configuration for different apartment types
const APARTMENT_TYPES = {
  total: {
    fetchMethod: getVacantApartments,
    url: "https://www.psoas.fi/en/apartments/?_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa",
    messages: {
      fetching: "Fetching vacant apartments...",
      found: (count) => `There is/are currently ${count} vacant apartment(s)`,
      notFound: "There are currently no vacant apartments",
      error: "Failed to fetch vacant apartments :( "
    }
  },
  shared: {
    fetchMethod: getVacantSharedApartments,
    url: "https://www.psoas.fi/en/apartments/?_sfm_htyyppi=k&_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa",
    messages: {
      fetching: "Fetching vacant shared apartments...",
      found: (count) => `There is/are currently ${count} vacant shared apartment(s)`,
      notFound: "There are currently no vacant shared apartments",
      error: "Failed to fetch vacant shared apartments :( "
    }
  },
  studio: {
    fetchMethod: getVacantStudioApartments,
    url: "https://www.psoas.fi/en/apartments/?_sfm_htyyppi=y&_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa",
    messages: {
      fetching: "Fetching vacant studio apartments...",
      found: (count) => `There is/are currently ${count} vacant studio apartment(s)`,
      notFound: "There are currently no vacant studio apartments",
      error: "Failed to fetch vacant studio apartments :( "
    }
  },
  family: {
    fetchMethod: getVacantFamilyApartments,
    url: "https://www.psoas.fi/en/apartments/?_sfm_htyyppi=p&_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa",
    messages: {
      fetching: "Fetching vacant family apartments...",
      found: (count) => `There is/are currently ${count} vacant family apartment(s)`,
      notFound: "There are currently no vacant family apartments",
      error: "Failed to fetch vacant family apartments :( "
    }
  }
};

// TODO: Implement these fetch methods
async function getVacantApartments() {
  const result = await ApartmentScraper.extractVacantApartments(
    ApartmentScraper.getUrl()
  );
  return result;
}

async function getVacantSharedApartments() {
  const result = await ApartmentScraper.extractVacantApartments(
    ApartmentScraper.getUrl('SHARED')
  );
  return result;
}

async function getVacantStudioApartments() {
  const result = await ApartmentScraper.extractVacantApartments(
    ApartmentScraper.getUrl('STUDIO')
  );
  return result;
}

async function getVacantFamilyApartments() {
  const result = await ApartmentScraper.extractVacantApartments(
    ApartmentScraper.getUrl('FAMILY')
  );
  return result;
}

async function history(limit) {
  return await ApartmentScraper.getApartmentHistory(limit);
}

// Utility function to handle common CLI command logic
async function handleApartmentCommand(apartmentType, argv) {
  // Optional: Uncomment if you want to check internet connectivity
  const isConnected = await ApartmentScraper.checkInternetConnectivity();
  if (!isConnected) {
    console.error("You are not connected to the internet");
    return;
  }

  const config = APARTMENT_TYPES[apartmentType];
  console.log(config.messages.fetching);

  // Create a loading indicator
  const loadingInterval = setInterval(() => {
    process.stdout.write(".");
  }, 500);

  try {
    // Fetch vacant apartments
    let vacantApartments = await config.fetchMethod();
    clearInterval(loadingInterval);
    vacantApartments = parseInt(vacantApartments);

    // Display results
    if (vacantApartments !== 0) {
      console.log(`\n${config.messages.found(vacantApartments)}`);
    } else {
      console.log(`\n${config.messages.notFound}`);
      return;
    }

    // Open website if -a/--avata flag is set
    if (argv.avata) {
      console.log("Opening the psoas website to the vacant apartments page...");
      open(config.url);
    }
  } catch (error) {
    clearInterval(loadingInterval);
    console.error(`\n${config.messages.error}`);
  } finally {
    process.exit(0);
  }
}

// Create CLI application using yargs
const cli = yargs(hideBin(process.argv));

// Add common options
const commonOptions = (yargs) => {
  return yargs.option("avata", {
    alias: "a",
    type: "boolean",
    description: "Open the psoas website to the vacant apartments page",
  });
};

// Configure commands dynamically
Object.keys(APARTMENT_TYPES).forEach(type => {
  if (type !== 'total') {
    cli.command(
      `vacant${type}`, 
      `get the number of vacant ${type} apartments`,
      commonOptions,
      async (argv) => handleApartmentCommand(type, argv)
    );
  } else {
    cli.command(
      'vacantapt', 
      'get total number of vacant apartments', 
      commonOptions,
      async (argv) => {
        if (argv.avata) {
          open(APARTMENT_TYPES.total.url);
        } if (argv.discord) {
          await ApartmentScraper.scrapeVacantApartments();
        }
        handleApartmentCommand(type, argv)
      }
    );
  }
});

// Add history command
cli.command(
  "history",
  "get the history of vacant apartments",
  (yargs) => {
    return yargs.option("limit", {
      alias: "l",
      type: "number",
      description: "Limit the number of history records to display",
    });
  },
  async (argv) => {
    console.log("Fetching history of vacant apartments...");

    const loadingInterval = setInterval(() => {
      process.stdout.write(".");
    }, 500);

    try {
      const historyData = await ApartmentScraper.getMostRecentApartmentData()
      clearInterval(loadingInterval);
      console.log("\nHistory of vacant apartments:");
      console.table(historyData);
    } catch (error) {
      clearInterval(loadingInterval);
      console.error("\nFailed to fetch history of vacant apartments :( ");
    } finally {
      process.exit(0);
    }
  }
)

// Add global options
.option("avata", {
  alias: "a",
  type: "boolean",
  description: "Open the psoas website to the vacant apartments page",
})
.option("limit", {
  alias: "l",
  type: "number",
  description: "Limit the number of history records to display",
})
.option("discord", {
  alias: "d",
  type: "boolean",
  description: "Send the vacant apartment data to Discord",
})
.demandCommand(1)
.parse();