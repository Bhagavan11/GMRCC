// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// // import authRoutes from './routes/authRoutes.js';
// import userQueryController from './controllers/userQueryController.js';
// import cookieParser from 'cookie-parser';
// import mongoose from 'mongoose';



// dotenv.config();

// const app = express();

// app.use(cors({
//   origin: ["https://gmrcc.vercel.app", "http://localhost:5173"],  // or your frontend dev port
//   credentials: true
// }));
// app.use(express.json());
// app.use(cookieParser());

// app.get('/', (req, res) => {
//   res.send('GMRIT Bot Backend Running ✅');
// });


// // app.use('/api/auth', authRoutes);
// app.use('/api/chatbot', userQueryController);


// const port = process.env.PORT || 5000;
// app.listen(port, () =>
//       console.log(`🚀 Server running on http://localhost:${port}`)
//     );

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import userQueryController from './controllers/userQueryController.js';

dotenv.config();

const app = express();

// ✅ Define allowed origins (no trailing slash)
const allowedOrigins = [
  "https://gmrcc.vercel.app",
  "http://localhost:5173"
];

// ✅ Apply CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(cookieParser());

// ✅ Test route
app.get('/', (req, res) => {
  res.send('GMRIT Bot Backend Running ✅');
});

// ✅ API routes
app.use('/api/chatbot', userQueryController);

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);



