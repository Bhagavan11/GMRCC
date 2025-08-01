import { User } from "../models/User.js";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

export async function signup(req, res) {
    try {
        const { email, password, username } = req.body;
        console.log("IAM TRIGGERED")

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

        // ✅ Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

    
        

        // ✅ Create Mongoose model instance
        const newuser = new User({
            email,
            password: hashedPassword,
            username,
        });

        // ✅ First, save the user
        await newuser.save();  

        // ✅ Then generate the token
        const token=await generateTokenAndSetCookie( newuser._id, res);
        console.log("token generated",token)

        res.status(201).json({
            success: true,
            message: "USER REGISTERED",
            user: {
                ...newuser._doc,
                password: ""  // Do not expose the password
            }
        });

    } catch (error) {
        console.log("error in signup controller", error.message);
        res.status(500).json({ success: false, message: "INTERNAL SERVER ERROR" });
    }
}

export async function login(req, res) {
    try{
        const { email, password } = req.body;
        console.log("i am logincontroller",email,password);
        if(!email ||!password)
        {
            return res.status(400).json({ success: false, message: "ALL FIELDS ARE REQUIRED" });
        }
        const user=await User.findOne({ email:email });
        if(!user)
        {
            return res.status(404).json({ success: false, message: "INAVLID EMAIL OR PASSWORD" });
        }
        const isMatch=await bcryptjs.compare(password,user.password);
        if(!isMatch)
        {
            return res.status(404).json({ success: false, message: "WRONG PASSWORD" });
        }
        generateTokenAndSetCookie(user._id,res);
        res.status(200).json({ success: true, message: "LOGIN SUCCESSFULLY", user: {
            ...user._doc,
            password: ""  // Do not expose the password
        }});

    }
    catch{
        console.log("error in login controller", error.message);
    }
    
}






export async function logout(req, res) {
    try{
        res.clearCookie("GMRIT_BOT_JWT");
        res.status(200).json({ success: true, message: "LOGOUT SUCCESSFULLY" });
    }
    catch(error)
    {
        res.status(500).json({ success: false, message: "INTERNAL SERVER ERROR" });
    }
}
export async function authCheck(req, res) {
    console.log("i am auth check")
    try {
        res.status(200).json({ success: true, user: req.user  });
        console.log("currently loged in user is",req.user)
    } catch (error) {
        console.error("Error in auth check controller:", error);
        res.status(500).json({ success: false, message: "INTERNAL SERVER ERROR" });
    }

}
