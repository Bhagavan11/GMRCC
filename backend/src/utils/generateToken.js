import jwt from "jsonwebtoken";
import cryptoRandomString from 'crypto-random-string';
import dotenv from "dotenv";

dotenv.config();

export const generateAuthToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.GMRIT_BOT_JWT, { expiresIn: "15d" });

   res.cookie("GMRIT_BOT_JWT", token, {
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 15, // 15 days
  sameSite: "Lax", // was "None"
  secure: false     // only set true in production with HTTPS
});
    return token;
};

export const generateVerificationToken = (userId) => {
    return cryptoRandomString({ length: 32, type: 'url-safe' });
};