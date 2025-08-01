import jwt from "jsonwebtoken"
import dotenv from "dotenv"

export const generateTokenAndSetCookie = (userId, res) => {
    console.log("Generating token for user:", process.env.GMRIT_BOT_JWT);  // Log for debugging purposes
    const token = jwt.sign({ userId }, process.env.GMRIT_BOT_JWT, { expiresIn: "15d" });

    res.cookie("GMRIT_BOT_JWT", token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 15,
        sameSite: "None",     // 👈 Required for cross-site cookies
        secure: true          // 👈 Required for HTTPS (like Render & Vercel)
      });
  
    return token;
  };
