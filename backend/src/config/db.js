import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
console.log("Connecting to MongoDB...",process.env.MONGO_URI); // Log for debugging purposes
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI );
        // console.log(conn);
        console.log("MONGODB CONNECTED: " + conn.connection.host);
    } catch (error) {
        console.log("ERROR CONNECTING TO MONGODB: " + error.message);
        process.exit(1);
    }
};
