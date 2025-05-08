import express from 'express';
import { 
  getParentLocationsNameAndUrl,
  vacantApartmentLocations,
  getVacancies,
  getVacantApartmentDetails,
  getAllVacantApartmentDetails,
  filterApartments
} from '../controller/apartments/apartment-controller.js';
const router = express.Router();

router.get('/api/ouluva/vacant_apartments', getVacantApartmentDetails); // the goat
router.get('/api/ouluva/parent_locations', getParentLocationsNameAndUrl); // parent loactions
router.get('/api/ouluva/vacant_apartment_locations', vacantApartmentLocations); // children locations
router.get('/api/ouluva/vacancies', getVacancies); // actual links to the vacant apartments (green vacant buttons)


// routes that deaal with getting information rather than updating them as previously seen
router.get('/api/ouluva/get_all_vacant_apartments', getAllVacantApartmentDetails);


// filtering routes
router.get('/api/ouluva/filter_apartments', filterApartments); // filter apartments by location, apartment type, price and size
export default router;