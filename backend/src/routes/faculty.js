import express from 'express';
import {fetchAndSaveFacultyInfo, getFaculty } from '../controllers/facultyController.js';

const router = express.Router();

router.get('/scrape', fetchAndSaveFacultyInfo); // e.g. /api/faculty/scrape/cse
router.get('/:code', getFaculty); // e.g. /api/faculty/cse

export default router;
