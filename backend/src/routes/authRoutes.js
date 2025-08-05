import express from 'express'
import { signup,login,logout,authCheck,verifyEmail } from '../controllers/authController.js'
import {protectRoute } from '../middlewares/protectRoute.js'
const router= express.Router()

router.post("/signup",signup)

router.post("/login",login)

router.post("/logout",logout)
router.get("/verify-email", verifyEmail)
router.get("/auth-check", protectRoute, authCheck);

export default router;