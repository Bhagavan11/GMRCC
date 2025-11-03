import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import authRoutes from './routes/authRoutes.js';
import userQueryController from './controllers/userQueryController.js';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';



dotenv.config();

const app = express();

app.use(cors({
  origin: ["https://gmr-campus-connect-tkwg.vercel.app", "http://localhost:5173"],  // or your frontend dev port
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('GMRIT Bot Backend Running ✅');
});


// app.use('/api/auth', authRoutes);
app.use('/api/chatbot', userQueryController);


const port = process.env.PORT || 5000;
app.listen(port, () =>
      console.log(`🚀 Server running on http://localhost:${port}`)
    );


