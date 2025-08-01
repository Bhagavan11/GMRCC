import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import collegeInfoRoutes from './routes/collegeInfoRoutes.js';
import queryRoutes from './routes/queryRoutes.js';
import mongoose from 'mongoose';
import facultyRoutes from './routes/faculty.js';
import admissionsRoute from './routes/admissions.js';
// import syncCollegeInfo from './scripts/syncCollegeInfo.js';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('GMRIT Bot Backend Running ✅');
});

app.use('/api/faculty', facultyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/college-info', collegeInfoRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/admissions', admissionsRoute);
// ✅ Connect DB first, then start server
const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
 
    app.listen(port, () =>
      console.log(`🚀 Server running on http://localhost:${port}`)
    );
       
  })
  .catch((err) => console.error('❌ DB connection failed:', err));
