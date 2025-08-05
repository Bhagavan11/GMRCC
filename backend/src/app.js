import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userQueryController from './controllers/userQueryController.js';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';



dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",  // or your frontend dev port
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('GMRIT Bot Backend Running ✅');
});


app.use('/api/auth', authRoutes);
app.use('/api/chatbot', userQueryController);


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
