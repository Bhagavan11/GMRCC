// src/routes/queryRoutes.js
import express from 'express';
import { queryCollegeBot} from '../controllers/queryController.js';

const router = express.Router();

router.post('/', queryCollegeBot);

export default router;
