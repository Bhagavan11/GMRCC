// src/routes/collegeInfoRoutes.js
import express from 'express';
import { fetchAndSaveCollegeInfo} from '../controllers/collegeInfoController.js';

const router = express.Router();

router.get('/scrape', fetchAndSaveCollegeInfo); // trigger scraping & saving
// router.get('/', getCollegeInfo); // fetch all college info

export default router;
