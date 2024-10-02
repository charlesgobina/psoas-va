import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import open from "open";
import {
  getVacantApartments,
  getVacantFamilyApartments,
  getVacantSharedApartments,
  getVacantStudioApartments,
  checkInternetConnectivity,
} from "../server.js";

yargs(hideBin(process.argv))
  .command(
    "vacantapt",
    "get total number of vacant apartments",
    (yargs) => {
      yargs.option("avata", {
        alias: "a",
        type: "boolean",
        description: "Open the psoas website to the vacant apartments page",
      });
    },
    async (argv) => {
      const isConnected = await checkInternetConnectivity();
      if (!isConnected) {
        console.error("You are not connected to the internet");
        return;
      }
      console.log("Fetching vacant apartments...");

      const loadingInterval = setInterval(() => {
        process.stdout.write(".");
      }, 500);

      try {
        let vacantApartments = await getVacantApartments();
        clearInterval(loadingInterval);
        vacantApartments = parseInt(vacantApartments);
        if (vacantApartments !== 0) {
          console.log(
            `\nThere is/are currently ${vacantApartments} vacant apartment(s)`
          );
        } else {
          console.log("\nThere are currently no vacant apartments");
        }

        if (argv.avata) {
          console.log(
            "Opening the psoas website to the vacant apartments page..."
          );
          open(
            "https://www.psoas.fi/en/apartments/?_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa"
          );
        }
      } catch (error) {
        clearInterval(loadingInterval);
        console.error("\nFailed to fetch vacant apartments :( ");
      }
    }
  )
  .command(
    "vacantshared",
    "get the number of vacant shared apartments",
    (yargs) => {
      yargs.option("avata", {
        alias: "a",
        type: "boolean",
        description: "Open the psoas website to the vacant apartments page",
      });
    },
    async (argv) => {
      const isConnected = await checkInternetConnectivity();
      if (!isConnected) {
        console.error("You are not connected to the internet");
        return;
      }
      console.log("Fetching vacant shared apartments...");

      const loadingInterval = setInterval(() => {
        process.stdout.write(".");
      }, 500);

      try {
        let vacantApartments = await getVacantSharedApartments();
        clearInterval(loadingInterval);
        vacantApartments = parseInt(vacantApartments);
        if (vacantApartments !== 0) {
          console.log(
            `\nThere is/are currently ${vacantApartments} vacant shared apartment(s)`
          );
        } else {
          console.log("\nThere are currently no vacant shared apartments");
        }

        if (argv.avata) {
          console.log(
            "Opening the psoas website to the vacant apartments page..."
          );
          open(
            "https://www.psoas.fi/en/apartments/?_sfm_htyyppi=shared&_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa"
          );
        }
      } catch (error) {
        clearInterval(loadingInterval);
        console.error("\nFailed to fetch vacant shared apartments :( ");
      }
    }
  )
  .command(
    "vacantstudio",
    "get the number of vacant studio apartments",
    (yargs) => {
      yargs.option("avata", {
        alias: "a",
        type: "boolean",
        description: "Open the psoas website to the vacant apartments page",
      });
    },
    async (argv) => {
      const isConnected = await checkInternetConnectivity();
      if (!isConnected) {
        console.error("You are not connected to the internet");
        return;
      }
      console.log("Fetching vacant studio apartments...");

      const loadingInterval = setInterval(() => {
        process.stdout.write(".");
      }, 500);

      try {
        let vacantApartments = await getVacantStudioApartments();
        clearInterval(loadingInterval);
        vacantApartments = parseInt(vacantApartments);
        if (vacantApartments !== 0) {
          console.log(
            `\nThere is/are currently ${vacantApartments} vacant studio apartment(s)`
          );
        } else {
          console.log("\nThere are currently no vacant studio apartments");
        }

        if (argv.avata) {
          console.log(
            "Opening the psoas website to the vacant apartments page..."
          );
          open(
            "https://www.psoas.fi/en/apartments/?_sfm_htyyppi=studio&_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa"
          );
        }
      } catch (error) {
        clearInterval(loadingInterval);
        console.error("\nFailed to fetch vacant studio apartments :( ");
      }
    }
  )
  .command(
    "vacantfamily",
    "get the number of vacant family apartments",
    (yargs) => {
      yargs.option("avata", {
        alias: "a",
        type: "boolean",
        description: "Open the psoas website to the vacant apartments page",
      });
    },
    async (argv) => {
      const isConnected = await checkInternetConnectivity();
      if (!isConnected) {
        console.error("You are not connected to the internet");
        return;
      }
      console.log("Fetching vacant family apartments...");

      const loadingInterval = setInterval(() => {
        process.stdout.write(".");
      }, 500);

      try {
        let vacantApartments = await getVacantFamilyApartments();
        clearInterval(loadingInterval);
        vacantApartments = parseInt(vacantApartments);
        if (vacantApartments !== 0) {
          console.log(
            `\nThere is/are currently ${vacantApartments} vacant family apartment(s)`
          );
        } else {
          console.log("\nThere are currently no vacant family apartments");
        }

        if (argv.avata) {
          console.log(
            "Opening the psoas website to the vacant apartments page..."
          );
          open(
            "https://www.psoas.fi/en/apartments/?_sfm_htyyppi=family&_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa"
          );
        }
      } catch (error) {
        clearInterval(loadingInterval);
        console.error("\nFailed to fetch vacant family apartments :( ");
      }
    }
  )
  .option("avata", {
    alias: "a",
    type: "boolean",
    description: "Open the psoas website to the vacant apartments page",
  })
  .demandCommand(1)
  .parse();
