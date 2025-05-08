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

  static async saveApartment(apartmentData) {
    try {
      await db
        .collection(this.apartmentCollection)
        .doc(apartmentData.apartmentType)
        .collection(`all${apartmentData.apartmentType}`)
        .doc(extractSpecificSlug(apartmentData.ownUrl))
        .set(apartmentData);
    } catch (e) {
      console.log(e);
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
          console.log("No unprocessed documents found.");
          return null;
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
  static async anyFilterApartments(location, apartmentType, price, size, rooms) {
    let sharedApartments = [];
    let studioApartments = [];
    let familyApartments = [];
    let allApartments = [];

    // first check the apartment type
    if (apartmentType === "shared") {
      // get all shared apartments
      const sharedSnapshot = await db
        .collection(this.apartmentCollection)
        .doc("shared")
        .collection("allshared")
        .get();
      sharedSnapshot.forEach((doc) => {
        const apartmentData = doc.data();
        // convert to apartment model
        const apartment = new ApartmentModel(apartmentData);

        // apply filters
        if (
          apartment.parentLocation === location ||
          apartment.sizeM2 <= size ||
          apartment.rent <= price ||
          apartment.rooms === rooms
        ) {
          sharedApartments.push(apartment.toJSON());
        }
      });
    }

  

    

    return [
      ...sharedApartments,
      ...studioApartments,
      ...familyApartments,
      ...allApartments,
    ];
  }
}

// ApartmentService.deleteOccupiedSharedApartments();

export default ApartmentService;
