import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies["GMRIT_BOT_JWT"];
        if(!token) {
            return res.status(401).json({ success: false, message: 'Token is required' });
        }
        
        const decoded = jwt.verify(token, process.env.GMRIT_BOT_JWT);
        if(!decoded) {
            return res.status(401).json({ success: false, message: 'Token is invalid' });
        }
        
        const user = await User.findById(decoded.userId).select('-password');
        if(!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        if(!user.isVerified) {
            return res.status(403).json({ success: false, message: "Access denied. Email not verified." });
        }
        
        req.user = user;
        console.log(`User ${user.username} authenticated successfully. protection route`);
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "INTERNAL SERVER ERROR" });
    }
};