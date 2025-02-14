import { ApartmentScraper } from "../../utils/apartment-scraper-helper.js";
import ApartmentService from "../../services/developer-service.js";

const apartmentController = async (req, res) => {
  const apartment = await ApartmentScraper.scrapeVacantApartments();
  console.log("Apartment:", apartment);
  return res.status(200).json({ apartment });
};

export default apartmentController;