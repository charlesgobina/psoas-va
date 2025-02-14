import express from 'express';
import apartmentController from '../controller/apartments/apartment-controller.js';
const router = express.Router();

router.get('/api/ouluva', apartmentController);

export default router;