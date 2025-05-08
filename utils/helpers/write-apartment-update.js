import ApartmentService from "../../services/apartment-service.js";
import ApartmentModel from "../../models/apartment-model.js";
import { v4 as uuidv4 } from "uuid";

const updateApartmentData = async (apartment) => {
  try {
    // construct the apartment model
    const apartmentData = new ApartmentModel(apartment);
    // save the apartment data
    await ApartmentService.saveApartment(uuidv4(), apartmentData.toJSON());
  } catch (error) {
    console.error("Error in updating apartment data:", error);
  }
}

export default updateApartmentData;