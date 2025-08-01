import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import dotenv from 'dotenv';


export const protectRoute = async (req, res, next) => {
    console.log("Protecting route...");  // Log for debugging purposes

    try {
        // Get token from header
        const token = req.cookies["GMRIT_BOT_JWT"];
        console.log("Token received:", token);  // Log for debugging purposes
        if(!token) {
            return res.status(401).json({ success: false, message: 'Token is required' });
        }
        const decoded = jwt.verify(token, process.env.GMRIT_BOT_JWT);
        console.log("Decoded token:", decoded);  // Log for debugging purposes
        console.log("Decoded token:", decoded);  // Log for debugging purposes
        if(!decoded) {
            return res.status(401).json({ success: false, message: 'Token is invalid' });
        }
        // Check user existence
        const user = await User.findById(decoded.userId).select('-password');
        console.log("User found:", user);  // Log for debugging purposes
        if(!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        req.user = user;  // Store user info in request object for later use
        console.log("User authenticated successfully",req.user);  
        next();
    }
    catch (error) {
        return res.status(500).json({ success: false, message: ""  });
    }
}