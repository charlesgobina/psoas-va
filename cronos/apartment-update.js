import { spawn } from "child_process";
import cron from "node-cron";
import { getVacancies, getAllVacantApartmentDetails, getVacantApartmentDetails } from "../controller/apartments/apartment-controller.js";
import ApartmentService from "../services/apartment-service.js";

// Configuration for rate limiting
const MAX_OPERATIONS_PER_HOUR = 500; // Adjust based on your Firestore limits
const OPERATIONS_PER_RUN = 25;
const RUNS_PER_HOUR = Math.ceil(MAX_OPERATIONS_PER_HOUR / OPERATIONS_PER_RUN);
const MINUTES_PER_HOUR = 60;
const RUN_INTERVAL = Math.floor(MINUTES_PER_HOUR / RUNS_PER_HOUR);

console.log(`Scheduling updates every ${RUN_INTERVAL} minutes`);

// Distribution of tasks throughout the day
// Run location and vacancy list updates 4 times a day
cron.schedule("0 */6 * * *", async () => {
  console.log("Updating location and vacancy lists...");
  try {
    // First update the parent location list
    // await updateParentLocations();
    
    // Then update vacant apartment locations
    // await updateVacantLocations();
    
    // Then get vacancy URLs
    await getVacancies();
    
    console.log("Location and vacancy lists updated successfully");
  } catch (error) {
    console.error("Error updating location lists:", error);
  }
});

// Process new apartments frequently but in small batches
cron.schedule(`*/${RUN_INTERVAL} * * * *`, async () => {
  console.log("Running incremental apartment updates...");
  try {
    // First clean up occupied apartments (once per hour to avoid redundancy)
    const currentMinute = new Date().getMinutes();
    if (currentMinute < RUN_INTERVAL) {
      console.log("Cleaning up occupied apartments...");
      await Promise.all([
        ApartmentService.deleteOccupiedSharedApartments(),
        ApartmentService.deleteOccupiedStudioApartments(),
        ApartmentService.deleteOccupiedFamilyApartments()
      ]);
    }
    
    // Process prioritized updates
    const updateCount = await ApartmentService.updatePrioritizedApartments();
    console.log(`Updated ${updateCount} apartments in this run`);
    
    // Process some new unprocessed documents if needed and if we have capacity
    if (updateCount < OPERATIONS_PER_RUN) {
      const remainingCapacity = OPERATIONS_PER_RUN - updateCount;
      console.log(`Processing up to ${remainingCapacity} new documents...`);
      const newDocuments = await ApartmentService.processNextBatchOfDocuments(remainingCapacity);
      console.log(`Processed ${newDocuments.length} new apartment listings`);
    }
  } catch (error) {
    console.error("Error in apartment update job:", error);
  }
});

// NEW: Comprehensive status update for all apartments in the database
// Run 4 times a day (every 6 hours) to catch any changes that weren't caught by other processes
cron.schedule("30 */6 * * *", async () => {
  console.log("Running comprehensive apartment status update...");
  try {
    const updateStats = await ApartmentService.updateAllApartmentStatuses();
    console.log(`Status update completed: ${updateStats.checked} apartments checked, ${updateStats.statusChanged} status changes`);
  } catch (error) {
    console.error("Error in apartment status update job:", error);
  }
});