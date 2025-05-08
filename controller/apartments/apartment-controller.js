import ApartmentService from "../../services/apartment-service.js";
import ApartmentModel from "../../models/apartment-model.js";
import LocationNameModel from "../../models/location-name-model.js";
import { extractLocation } from "../../utils/helpers/apartment-helpers.js";
import { v4 as uuidv4 } from "uuid";
import {
  getLinkToVacantAppartmentProperties,
  getLocationsNameAndUrl,
  getApartmentPropertiesUrl,
  getDisplayedVacantApartments,
  extractApartmentDetails,
} from "../../utils/get-locations-url.js";

// in charge of overall apartment data getting. Keeps the apartment data in the database updated

const getParentLocationsNameAndUrl = async (req, res) => {
  const locations = await getLocationsNameAndUrl();
  const locationNames = [];

  try {
    for (let sLocation of locations) {
      const slug = extractLocation(sLocation.locUrl);
      const locationData = new LocationNameModel(sLocation);
      locationData.slug = slug;
      await ApartmentService.savelocation(uuidv4(), locationData.toJson());
      locationNames.push(locationData.toJson());
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.status(200).json(locationNames);
};

const vacantApartmentLocations = async (req, res) => {
  const vapaa = await getDisplayedVacantApartments();
  try {
    for (const vacantApartment of vapaa) {
      // check if the location exists in the database (parentLocations)
      const location = await ApartmentService.fetchDocumentByField(
        "parentLocations",
        "slug",
        vacantApartment
      );

      if (location.length === 0) {
        return res
          .status(404)
          .json({ message: "No vacant apartment", location: [] });
      } else {
        for (const loc of location) {
          const locationData = new LocationNameModel(loc);
          await ApartmentService.potentiallyVacantApartmentLocations(
            locationData.toJson()
          );
        }
      }
    }
    return res
      .status(200)
      .json({ message: "Vacant apartment locations updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getVacancies = async (req, res) => {
  // get data from childLocations collection
  const locations = await ApartmentService.getAllDocuments("childLocations");
  let vacancies = [];
  try {
    for (const location of locations) {
      const locationData = new LocationNameModel(location);
      vacancies.push(locationData);
    }
    // console.log(vacancies);
    // console.log("Vacancies length:", vacancies.length);
    // console.log("Vacancies:", vacancies[0]);

    // vacancies = vacancies.slice(0, 2);

    const apartmentProperties = await getApartmentPropertiesUrl(vacancies);
    for (const apartmentProperty of apartmentProperties) {
      const lo = {
        locName: apartmentProperty.location,
        locUrl: apartmentProperty.url,
        slug: apartmentProperty.slug,
        apartmentType: apartmentProperty.apartmentType,
      };
      let propertyData = new LocationNameModel(lo);
      await ApartmentService.saveVacanciesUrl(propertyData.toJson());
    }
    // save the vacant apartment properties
    return res.status(200).json({message: "Vacant apartment properties url updated successfully"});
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getVacantApartmentDetails = async (req, res) => {
  try {
    const vacantApartmentDetails = await ApartmentService.processNextDocument();
    res.status(200).json({
      message: "Vacant apartment details updated successfully",
      vacantApartmentDetails,
    })
  } catch (error) {
    if (error.message === "No documents to process") {
      return res.status(404).json({ message: 'All documents have been processed' });
    } else {
      return res.status(500).json({ message: error.message });
    }
  }
}

const getAllVacantApartmentDetails = async (req, res) => {
  try {
    const vacantApartmentDetails = await ApartmentService.getAllVacantApartments();
    console.log(vacantApartmentDetails);
    res.status(200).json({
      message: "All vacant apartment details",
      vacantApartmentDetails,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// fliter apartments by location, apartment type, price and size
const filterApartments = async (req, res) => {
  const { location, apartmentType, price, size, rooms } = req.query;
  console.log(location, apartmentType, price, size, rooms);
  try {
    const apartments = await ApartmentService.anyFilterApartments(
      location,
      apartmentType,
      price,
      size,
      rooms
    );
    res.status(200).json(apartments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export {
  getParentLocationsNameAndUrl,
  vacantApartmentLocations,
  getVacancies,
  getVacantApartmentDetails,
  getAllVacantApartmentDetails,
  filterApartments
};
