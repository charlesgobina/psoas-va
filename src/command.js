import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import open from "open";
import { getVacantApartments, checkInternetConnectivity } from "../server.js";


yargs(hideBin(process.argv))
  .command('vacantapt', 'get the number of vacant apartments from psoas website', yargs => {
    yargs.option('avata', {
      alias: 'a',
      type: 'boolean',
      description: 'Open the psoas website to the vacant apartments page'
    });
  }, async (argv) => {
    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      console.error("You are not connected to the internet");
      return;
    }
    console.log('Fetching vacant apartments...');
    
    const loadingInterval = setInterval(() => {
      process.stdout.write('.');
    }, 500);

    try {
      let vacantApartments = await getVacantApartments();
      clearInterval(loadingInterval);
      vacantApartments = parseInt(vacantApartments);
      if (vacantApartments !== 0) {
        console.log(`\nThere are currently ${vacantApartments} vacant apartments`);
        
      } else {
        console.log("\nThere are currently no vacant apartments");
      }

      if (argv.avata) {
        console.log("Opening the psoas website to the vacant apartments page...");
        open("https://www.psoas.fi/en/apartments/?_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa");
      }

    } catch (error) {
      clearInterval(loadingInterval);
      console.error("\nFailed to fetch vacant apartments :( ");
    }
  }).option('avata', {
    alias: 'a',
    type: 'boolean',
    description: 'Open the psoas website to the vacant apartments page'
  })
  .demandCommand(1)
  .parse();