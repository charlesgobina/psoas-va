import { spawn } from "child_process";
import cron from "node-cron";
import { getVacancies, getAllVacantApartmentDetails, getVacantApartmentDetails } from "../controller/apartments/apartment-controller.js";
import ApartmentService from "../services/apartment-service.js";


cron.schedule("*/30 * * * *", async () => {
  console.log("Running apartment update cron job...");
  // await ApartmentService.deleteOccupiedSharedApartments();
  await getVacancies();
});


// Run every 5 minutes
cron.schedule("*/1 * * * *", async () => {
  console.log("Running apartment update cron job...");
  await ApartmentService.deleteOccupiedSharedApartments();
  // await getAllVacantApartmentDetails();
  await getVacantApartmentDetails();
});