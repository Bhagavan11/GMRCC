import express from 'express';
import {
  fetchAndSaveAdmissionsInfo,
  getAdmissions
} from '../controllers/admissionsController.js';

const router = express.Router();

// POST: Scrape + embed + store admissions info
router.post('/scrape', fetchAndSaveAdmissionsInfo);

// GET: Get all admissions info by category (e.g., overview, cutoff, fees)
router.get('/:category', getAdmissions);

export default router;
