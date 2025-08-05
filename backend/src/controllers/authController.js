import { User } from "../models/User.js";
import bcryptjs from "bcryptjs";
import { generateAuthToken, generateVerificationToken } from "../utils/generateToken.js";
import { Resend } from 'resend';
import cryptoRandomString from 'crypto-random-string';
import dotenv from "dotenv";
dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(user) {
    const verificationToken = generateVerificationToken(user._id);
    user.verificationToken = verificationToken;
    await user.save();
    
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const { data, error } = await resend.emails.send({
        from: 'GMRCC<onboarding@resend.dev>', // Use a verified domain from your Resend account
        to: [user.email],
        subject: 'GMRIT Campus Connect: Email Verification',
        html: `
            <p>Hello ${user.username},</p>
            <p>Thank you for signing up with Campus Connect. Please click the link below to verify your email address:</p>
            <p><a href="${verificationLink}">Verify Email Address</a></p>
            <p>If you did not sign up for this service, please ignore this email.</p>
        `
    });

    if (error) {
        console.error("Error sending verification email with Resend:", error);
    }
}

export async function signup(req, res) {
    try {
        const { email, password, username } = req.body;
        console.log("Received signup request with email:", email, "and username:", username);
        if (!email || !username || !password) {
            return res.status(400).json({ success: false, message: "ALL FIELDS ARE REQUIRED" });
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "INVALID EMAIL" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "PASSWORD MUST BE AT LEAST 6 CHARACTERS" });
        }

        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return res.status(400).json({ success: false, message: "Username already exists" });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const newuser = new User({
            email,
            password: hashedPassword,
            username,
            isVerified: false,
        });

        await newuser.save(); 
        await sendVerificationEmail(newuser);
        const token=generateAuthToken(newuser._id, res);
console.log("Generated JWT token:", token);
        return res.status(201).json({
            success: true,
            message: "USER REGISTERED. PLEASE CHECK YOUR EMAIL FOR VERIFICATION.",
            user: { ...newuser._doc, password: "" }
        });

    } catch (error) {
        console.log("error in signup controller", error.message);
        return res.status(500).json({ success: false, message: "INTERNAL SERVER ERROR" });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "ALL FIELDS ARE REQUIRED" });
        }

        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ success: false, message: "INAVLID EMAIL OR PASSWORD" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: "EMAIL NOT VERIFIED. PLEASE CHECK YOUR INBOX." });
        }

        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(404).json({ success: false, message: "WRONG PASSWORD" });
        }

        generateAuthToken(user._id, res);
        return res.status(200).json({ success: true, message: "LOGIN SUCCESSFULLY", user: { ...user._doc, password: "" }});
    } catch(error) {
        console.log("error in login controller", error.message);
        return res.status(500).json({ success: false, message: "INTERNAL SERVER ERROR" });
    }
}

export async function logout(req, res) {
    try {
        res.clearCookie("GMRIT_BOT_JWT");
        return res.status(200).json({ success: true, message: "LOGOUT SUCCESSFULLY" });
    } catch(error) {
        console.log("error in logout controller", error.message);
        return res.status(500).json({ success: false, message: "INTERNAL SERVER ERROR" });
    }
}

export async function authCheck(req, res) {
    console.log("i am auth check");
    try {
        return res.status(200).json({ success: true, user: req.user });
    } catch (error) {
        console.error("Error in auth check controller:", error);
        return res.status(500).json({ success: false, message: "INTERNAL SERVER ERROR" });
    }
}

export async function verifyEmail(req, res) {
    
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ success: false, message: "Verification token is missing." });
        }

        const user = await User.findOne({ verificationToken: token });
        
        if (!user) {
            return res.status(404).json({ success: false, message: "Invalid or expired verification token." });
        }

        user.isVerified = true;
        user.verificationToken = undefined; // Clear the token
        await user.save();

        return res.status(200).json({ success: true, message: "Email successfully verified!" });
    } catch (error) {
        console.error("Error in verifyEmail controller:", error);
        return res.status(500).json({ success: false, message: "INTERNAL SERVER ERROR" });
    }
}
