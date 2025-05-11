import { db } from "../config/admin-config.js";
import { extractApartmentDetails } from "../utils/get-locations-url.js";
import ApartmentModel from "../models/apartment-model.js";
import {
  extractLocation,
  extractSpecificSlug,
} from "../utils/helpers/apartment-helpers.js";

class ApartmentService {
  static apartmentCollection = "apartmento";
  static parentLocationCollection = "parentLocations";
  static childLocationCollection = "childLocations";
  static vacanciesCollection = "vacancies";

  // static async saveApartment(apartmentData) {
  //   try {
  //     await db
  //       .collection(this.apartmentCollection)
  //       .doc(apartmentData.apartmentType)
  //       .collection(`all${apartmentData.apartmentType}`)
  //       .doc(extractSpecificSlug(apartmentData.ownUrl))
  //       .set(apartmentData);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // Replace the existing saveApartment method in ApartmentService
  static async saveApartment(apartmentData) {
    try {
      const docRef = db
        .collection(this.apartmentCollection)
        .doc(apartmentData.apartmentType)
        .collection(`all${apartmentData.apartmentType}`)
        .doc(extractSpecificSlug(apartmentData.ownUrl));

      // First check if document exists
      const existingDoc = await docRef.get();

      if (existingDoc.exists) {
        const existingData = existingDoc.data();

        // Check if availability status changed
        const wasAvailable = existingData.isAvailable;
        const isAvailable = apartmentData.isAvailable;

        // Update timestamps
        apartmentData.lastChecked = new Date();

        // If status changed or other important fields changed
        if (
          wasAvailable !== isAvailable ||
          existingData.rent !== apartmentData.rent ||
          existingData.vacantFrom !== apartmentData.vacantFrom
        ) {
          apartmentData.lastUpdated = new Date();

          // Log status changes
          if (wasAvailable !== isAvailable) {
            console.log(
              `Apartment status changed for ${apartmentData.ownUrl}: ${
                wasAvailable ? "available" : "unavailable"
              } → ${isAvailable ? "available" : "unavailable"}`
            );
          }

          // Update the document with new data
          await docRef.update(apartmentData);
        } else {
          // Just update the timestamp
          await docRef.update({ lastChecked: new Date() });
        }
      } else {
        // New apartment, add timestamps
        apartmentData.createdAt = new Date();
        apartmentData.lastUpdated = new Date();
        apartmentData.lastChecked = new Date();

        // Create the document
        await docRef.set(apartmentData);
        console.log(`New apartment added: ${apartmentData.ownUrl}`);
      }
    } catch (e) {
      console.error(`Error saving apartment ${apartmentData.ownUrl}:`, e);
      throw e;
    }
  }

  // get all vacant apartments
  static async getAllVacantApartments() {
    const allVacantApartments = [];
    try {
      // First, get all apartment types
      const apartmentTypesSnapshot = await db
        .collection(this.apartmentCollection)
        .get();
      console.log("Found apartment types:", apartmentTypesSnapshot);
      // For each apartment type, get all apartments in its subcollection
      for (const typeDoc of apartmentTypesSnapshot.docs) {
        const apartmentType = typeDoc.id;
        console.log("Getting apartments for type:", apartmentType);
        const apartmentsSnapshot = await db
          .collection(this.apartmentCollection)
          .doc(apartmentType)
          .collection(`all${apartmentType}`)
          .get();

        // Add each apartment to our results array
        apartmentsSnapshot.docs.forEach((doc) => {
          allVacantApartments.push({
            id: doc.id,
            apartmentType,
            ...doc.data(),
          });
        });
      }

      console.log("Found apartments:", allVacantApartments.length);
      return allVacantApartments;
    } catch (e) {
      console.error("Error getting vacant apartments:", e);
      throw e; // Rethrow to allow caller to handle the error
    }
  }

  static async savelocation(id, locationData) {
    try {
      await db
        .collection(this.parentLocationCollection)
        .doc(id)
        .set(locationData);
    } catch (e) {
      console.log(e);
    }
  }

  // fetch document by field
  static async fetchDocumentByField(collection, field, value) {
    try {
      const snapshot = await db
        .collection(collection)
        .where(field, "==", value)
        .get();
      return snapshot.docs.map((doc) => doc.data());
    } catch (e) {
      console.log(e);
    }
  }

  // potentially vacant apartment locations
  static async potentiallyVacantApartmentLocations(locationData) {
    try {
      await db
        .collection(this.childLocationCollection)
        .doc(locationData.slug)
        .set(locationData);
    } catch (e) {
      console.log(e);
    }
  }

  // get all documents from a collection
  static async getAllDocuments(collection) {
    try {
      const snapshot = await db.collection(collection).get();
      return snapshot.docs.map((doc) => doc.data());
    } catch (e) {
      console.log(e);
    }
  }

  // save all vacancies url
  static async saveVacanciesUrl(vacancyData) {
    try {
      await db
        .collection(this.vacanciesCollection)
        .doc(vacancyData.slug)
        .set(vacancyData);
    } catch (e) {
      console.log(e);
    }
  }

  // delete already occupied apartments, by checking the reserveButton and vacantFrom fields
  static async deleteOccupiedSharedApartments() {
    try {
      const sharedSnapshot = await db
        .collection(this.apartmentCollection)
        .doc("shared")
        .collection("allshared")
        .get();

      console.log("Found shared apartments:", sharedSnapshot.size);
      sharedSnapshot.forEach(async (doc) => {
        const apartmentData = doc.data();

        const apartment = new ApartmentModel(apartmentData);

        // add new field called locUrl = apartment.ownUrl
        apartment.locUrl = apartment.ownUrl;

        // extract the apartment details
        const apartmentDetails = await extractApartmentDetails(apartment);

        // check if the apartment has been occupied
        if (
          apartmentDetails.reserveButton === "" &&
          (apartmentDetails.vacantFrom === "" ||
            apartmentDetails.vacantFrom === undefined ||
            apartmentDetails.reserveButton === undefined)
        ) {
          console.log(`Deleting document: ${doc.id}`);
          doc.ref.delete();
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

  static async deleteOccupiedStudioApartments() {
    try {
      const studioSnapshot = await db
        .collection(this.apartmentCollection)
        .doc("studio")
        .collection("allstudio")
        .get();

      console.log("Found studio apartments:", studioSnapshot.size);
      studioSnapshot.forEach(async (doc) => {
        const apartmentData = doc.data();

        const apartment = new ApartmentModel(apartmentData);

        // add new field called locUrl = apartment.ownUrl
        apartment.locUrl = apartment.ownUrl;

        // extract the apartment details
        const apartmentDetails = await extractApartmentDetails(apartment);

        // check if the apartment has been occupied
        if (
          apartmentDetails.reserveButton === "" &&
          (apartmentDetails.vacantFrom === "" ||
            apartmentDetails.vacantFrom === undefined ||
            apartmentDetails.reserveButton === undefined)
        ) {
          console.log(`Deleting document: ${doc.id}`);
          doc.ref.delete();
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

  static async deleteOccupiedFamilyApartments() {
    try {
      const familySnapshot = await db
        .collection(this.apartmentCollection)
        .doc("family")
        .collection("allfamily")
        .get();

      console.log("Found family apartments:", familySnapshot.size);

      familySnapshot.forEach(async (doc) => {
        const apartmentData = doc.data();
        const apartment = new ApartmentModel(apartmentData);
        // add new field called locUrl = apartment.ownUrl
        apartment.locUrl = apartment.ownUrl;
        // extract the apartment details
        const apartmentDetails = await extractApartmentDetails(apartment);
        // check if the apartment has been occupied
        if (
          apartmentDetails.reserveButton === "" &&
          (apartmentDetails.vacantFrom === "" ||
            apartmentDetails.vacantFrom === undefined ||
            apartmentDetails.reserveButton === undefined)
        ) {
          console.log(`Deleting document: ${doc.id}`);
          doc.ref.delete();
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

  // process next document
  static async processNextDocument() {
    const vacanciesRef = db.collection(this.vacanciesCollection);
    const apartmentRef = db.collection(this.apartmentCollection);

    // query unprocessed documents
    try {
      return await db.runTransaction(async (transaction) => {
        const query = vacanciesRef
          .where("processed", "==", false)
          .orderBy("__name__")
          .limit(1);

        console.log("Querying for unprocessed documents...");
        const snapshot = await transaction.get(query);

        if (snapshot.empty) {
          // get all apartments
          const allVacantApartments = await this.getAllVacantApartments();

          console.log("Found all vacant apartments:", allVacantApartments);

          // console.log("No unprocessed documents found.");
          // return null;
        }

        const doc = snapshot.docs[0];
        const docRef = doc.ref;

        console.log(`Processing document: ${doc.data().locUrl}`);

        // extract the apartment details
        const apartmentData = await extractApartmentDetails(doc.data());

        // create apartment model
        const apartment = new ApartmentModel(apartmentData);

        // update apartment type
        apartment.apartmentType = doc.data().apartmentType;

        console.log(`Apartment details: ${apartment.toJSON()}`);

        // write to the apartment collection
        this.saveApartment(apartment.toJSON());

        // mark the document as processed
        transaction.update(docRef, { processed: true });

        return apartment;
      });
    } catch (e) {
      console.log(e);
    }

    //
  }

  // filter apartments by location, size, price and apartment type
  // Replace your existing anyFilterApartments method with this improved version
  static async anyFilterApartments(
    location,
    apartmentType,
    price,
    size,
    rooms
  ) {
    try {
      const apartments = [];
      let apartmentTypes = [];

      // Determine which apartment types to query
      if (apartmentType && apartmentType !== "all") {
        apartmentTypes = [apartmentType];
      } else {
        apartmentTypes = ["shared", "studio", "family"];
      }

      // Process each apartment type
      for (const type of apartmentTypes) {
        // Start building the query
        let query = db
          .collection(this.apartmentCollection)
          .doc(type)
          .collection(`all${type}`);

        // Apply filters on the database side when possible
        if (location) {
          query = query.where("parentLocation", "==", location);
        }

        if (price && !isNaN(parseFloat(price))) {
          const priceValue = parseFloat(price);
          query = query.where("rent", "<=", priceValue);
        }

        // For size and rooms, we might need client-side filtering
        // since Firestore doesn't support multiple range operators
        const snapshot = await query.get();

        snapshot.forEach((doc) => {
          const apartmentData = doc.data();
          let includeApartment = true;

          // Additional client-side filtering
          if (
            size &&
            !isNaN(parseFloat(size)) &&
            apartmentData.sizeM2 > parseFloat(size)
          ) {
            includeApartment = false;
          }

          if (
            rooms &&
            !isNaN(parseInt(rooms)) &&
            apartmentData.rooms !== parseInt(rooms)
          ) {
            includeApartment = false;
          }

          if (includeApartment) {
            apartments.push({
              id: doc.id,
              apartmentType: type,
              ...apartmentData,
            });
          }
        });
      }

      return apartments;
    } catch (e) {
      console.error("Error filtering apartments:", e);
      throw e;
    }
  }

  // Add to ApartmentService
  static async updatePrioritizedApartments() {
    try {
      // Define update priority tiers
      const now = new Date();

      // Tier 1: Apartments not checked in the last 6 hours
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      // Tier 2: Recently listed apartments (checked more frequently)
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      // Collect all apartment types
      const apartmentTypes = ["shared", "studio", "family"];
      let updatesPerformed = 0;

      for (const apartmentType of apartmentTypes) {
        // Tier 1: Priority updates (not checked recently)
        const outdatedApartments = await db
          .collection(this.apartmentCollection)
          .doc(apartmentType)
          .collection(`all${apartmentType}`)
          .where("lastChecked", "<", sixHoursAgo)
          .limit(10)
          .get();

        for (const doc of outdatedApartments.docs) {
          const apartment = doc.data();
          apartment.locUrl = apartment.ownUrl;

          // Re-fetch apartment details from source
          const updatedDetails = await extractApartmentDetails(apartment);
          const updatedApartment = new ApartmentModel(updatedDetails);
          updatedApartment.apartmentType = apartmentType;

          // Save with change detection
          const wasUpdated = await this.saveApartmentWithChangeDetection(
            updatedApartment.toJSON()
          );
          if (wasUpdated) updatesPerformed++;

          // Limit number of operations per run
          if (updatesPerformed >= 25) return updatesPerformed;
        }

        // Tier 2: New apartments (check more frequently)
        if (updatesPerformed < 25) {
          const newApartments = await db
            .collection(this.apartmentCollection)
            .doc(apartmentType)
            .collection(`all${apartmentType}`)
            .where("createdAt", ">", threeDaysAgo)
            .where(
              "lastChecked",
              "<",
              new Date(now.getTime() - 2 * 60 * 60 * 1000)
            ) // 2 hours ago
            .limit(10)
            .get();

          for (const doc of newApartments.docs) {
            const apartment = doc.data();
            apartment.locUrl = apartment.ownUrl;

            const updatedDetails = await extractApartmentDetails(apartment);
            const updatedApartment = new ApartmentModel(updatedDetails);
            updatedApartment.apartmentType = apartmentType;

            const wasUpdated = await this.saveApartmentWithChangeDetection(
              updatedApartment.toJSON()
            );
            if (wasUpdated) updatesPerformed++;

            if (updatesPerformed >= 25) return updatesPerformed;
          }
        }
      }

      return updatesPerformed;
    } catch (e) {
      console.error("Error during prioritized updates:", e);
      throw e;
    }
  }

  static async processNextBatchOfDocuments(batchSize = 5) {
    const vacanciesRef = db.collection(this.vacanciesCollection);
    const results = [];

    try {
      // Get a batch of unprocessed documents
      const snapshot = await vacanciesRef
        .where("processed", "==", false)
        .orderBy("__name__")
        .limit(batchSize)
        .get();

      if (snapshot.empty) {
        console.log("No unprocessed documents found.");
        return [];
      }

      // Process each document in the batch
      const batch = db.batch();
      const processPromises = [];

      snapshot.docs.forEach((doc) => {
        const docRef = doc.ref;
        const docData = doc.data();

        // Add processing promise
        processPromises.push(
          extractApartmentDetails(docData)
            .then((apartmentData) => {
              // Create apartment model with appropriate timestamps and status
              const apartment = new ApartmentModel(apartmentData);
              apartment.apartmentType = docData.apartmentType;

              // Set creation and update timestamps
              apartment.createdAt = new Date();
              apartment.lastUpdated = new Date();
              apartment.lastChecked = new Date();

              // Determine availability based on reserveButton and vacantFrom values
              // This is now handled in the ApartmentModel constructor using _determineAvailability

              // Add to results
              results.push(apartment);

              // Save apartment to appropriate collection with status handling
              this.saveApartment(apartment.toJSON());

              // Mark as processed in batch
              batch.update(docRef, { processed: true });
            })
            .catch((error) => {
              console.error(
                `Error processing document ${docData.locUrl}:`,
                error
              );
              // Still mark as processed to avoid getting stuck on problem documents
              batch.update(docRef, {
                processed: true,
                processingError: error.message,
                errorTimestamp: new Date(),
              });
            })
        );
      });

      // Wait for all processing to complete
      await Promise.all(processPromises);

      // Commit the batch update
      await batch.commit();

      console.log(`Processed ${results.length} documents in batch`);
      return results;
    } catch (e) {
      console.error("Error processing batch:", e);
      throw e;
    }
  }

  // Add this to your ApartmentService class
  static async saveApartmentWithChangeDetection(apartmentData) {
    try {
      const docRef = db
        .collection(this.apartmentCollection)
        .doc(apartmentData.apartmentType)
        .collection(`all${apartmentData.apartmentType}`)
        .doc(extractSpecificSlug(apartmentData.ownUrl));

      // First check if document exists
      const existingDoc = await docRef.get();

      if (existingDoc.exists) {
        const existingData = existingDoc.data();

        // Add timestamp to track last update check
        apartmentData.lastChecked = new Date();

        // Only update if there are meaningful changes
        if (hasSignificantChanges(existingData, apartmentData)) {
          apartmentData.lastUpdated = new Date();
          await docRef.set(apartmentData);
          console.log(`Updated apartment: ${apartmentData.ownUrl}`);
          return true; // Data was updated
        } else {
          // Just update the lastChecked timestamp without a full write
          await docRef.update({ lastChecked: new Date() });
          console.log(`No changes for apartment: ${apartmentData.ownUrl}`);
          return false; // No significant changes
        }
      } else {
        // New document, add creation timestamp
        apartmentData.createdAt = new Date();
        apartmentData.lastUpdated = new Date();
        apartmentData.lastChecked = new Date();
        await docRef.set(apartmentData);
        console.log(`Created new apartment: ${apartmentData.ownUrl}`);
        return true; // New data was created
      }
    } catch (e) {
      console.error(`Error saving apartment ${apartmentData.ownUrl}:`, e);
      throw e;
    }
  }

  // Helper function to detect significant changes in apartment data
  hasSignificantChanges(oldData, newData) {
    // Fields to compare for changes
    const significantFields = [
      "rent",
      "vacantFrom",
      "reserveButton",
      "sizeM2",
      "apartmentLevel",
      "roomCount",
      "apartmentCondition",
    ];

    for (const field of significantFields) {
      if (oldData[field] !== newData[field]) {
        console.log(
          `Field '${field}' changed from '${oldData[field]}' to '${newData[field]}'`
        );
        return true;
      }
    }

    return false;
  }

  // Add to ApartmentService class
  static async updateAllApartmentStatuses() {
    console.log("Starting comprehensive apartment status update...");
    const updatedCount = {
      checked: 0,
      statusChanged: 0,
    };

    try {
      // Process each apartment type
      const apartmentTypes = ["shared", "studio", "family"];

      for (const type of apartmentTypes) {
        // Get all apartments of this type that are currently marked as available
        const apartmentsSnapshot = await db
          .collection(this.apartmentCollection)
          .doc(type)
          .collection(`all${type}`)
          .get();

        console.log(
          `Found ${apartmentsSnapshot.size} ${type} apartments to check`
        );

        // Process apartments in batches to avoid overwhelming the source website
        const batchSize = 10;
        const apartments = apartmentsSnapshot.docs;

        for (let i = 0; i < apartments.length; i += batchSize) {
          const batch = apartments.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (doc) => {
              const apartment = doc.data();

              // Only update if it's been a while since the last check
              const lastChecked = apartment.lastChecked
                ? apartment.lastChecked.toDate()
                : new Date(0);
              const hoursSinceLastCheck =
                (new Date() - lastChecked) / (1000 * 60 * 60);

              // Skip if checked recently (within the last 6 hours)
              if (hoursSinceLastCheck < 6) {
                return;
              }

              try {
                // Prepare for re-checking the apartment status
                const aptToCheck = {
                  ...apartment,
                  locUrl: apartment.ownUrl, // Ensure this field is present for the extraction function
                };

                // Re-fetch the apartment details from the source website
                const freshDetails = await extractApartmentDetails(aptToCheck);
                updatedCount.checked++;

                // Check if the availability status has changed
                const wasAvailable =
                  apartment.reserveButton !== "" && apartment.vacantFrom !== "";
                const isAvailable =
                  freshDetails.reserveButton !== "" &&
                  freshDetails.vacantFrom !== "";

                // Update the apartment in database if the status changed
                if (
                  wasAvailable !== isAvailable ||
                  apartment.rent !== freshDetails.rent
                ) {
                  updatedCount.statusChanged++;

                  // Update with new details
                  await db
                    .collection(this.apartmentCollection)
                    .doc(type)
                    .collection(`all${type}`)
                    .doc(doc.id)
                    .update({
                      reserveButton: freshDetails.reserveButton,
                      vacantFrom: freshDetails.vacantFrom,
                      rent: freshDetails.rent,
                      lastChecked: new Date(),
                      lastUpdated: new Date(),
                      isAvailable: isAvailable, // Add explicit status field
                    });

                  console.log(
                    `Updated status for ${apartment.ownUrl}: ${
                      wasAvailable ? "available" : "unavailable"
                    } → ${isAvailable ? "available" : "unavailable"}`
                  );
                } else {
                  // Just update the lastChecked timestamp
                  await db
                    .collection(this.apartmentCollection)
                    .doc(type)
                    .collection(`all${type}`)
                    .doc(doc.id)
                    .update({
                      lastChecked: new Date(),
                    });
                }
              } catch (error) {
                console.error(
                  `Error updating apartment ${apartment.ownUrl}:`,
                  error
                );
              }
            })
          );

          // Pause briefly between batches to avoid overwhelming the source website
          console.log(
            `Processed batch ${Math.ceil(i / batchSize) + 1} of ${Math.ceil(
              apartments.length / batchSize
            )}`
          );
          if (i + batchSize < apartments.length) {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second pause between batches
          }
        }
      }

      console.log(
        `Status update completed: ${updatedCount.checked} apartments checked, ${updatedCount.statusChanged} status changes`
      );
      return updatedCount;
    } catch (error) {
      console.error("Error in updateAllApartmentStatuses:", error);
      throw error;
    }
  }
}

// ApartmentService.deleteOccupiedSharedApartments();

export default ApartmentService;
