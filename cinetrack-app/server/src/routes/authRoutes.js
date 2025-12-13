const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");
const { JWT_SECRET, authMiddleware } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema, changePasswordSchema } = require("../validation/schemas");
const { ObjectId } = require("mongodb");

const router = express.Router();

const INVITE_CODES = config.inviteCodes;

module.exports = (usersCollection) => {
    // POST /api/auth/register
    router.post("/register", validate(registerSchema), async (req, res) => {
        try {
            const { email, password, inviteCode } = req.body;

            if (!INVITE_CODES.includes(inviteCode)) {
                return res.status(403).json({ message: "Invalid invite code" });
            }

            const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(409).json({ message: "Email already registered" });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const result = await usersCollection.insertOne({
                email: email.toLowerCase(),
                passwordHash,
                createdAt: new Date(),
            });

            const token = jwt.sign({ userId: result.insertedId.toString() }, JWT_SECRET, {
                expiresIn: "7d",
            });

            res.status(201).json({
                message: "Account created successfully",
                token,
                user: { id: result.insertedId, email: email.toLowerCase() },
            });
        } catch (err) {
            console.error("Registration error:", err);
            res.status(500).json({ message: "Server error during registration" });
        }
    });

    // POST /api/auth/login
    router.post("/login", validate(loginSchema), async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await usersCollection.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (!isValid) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
                expiresIn: "7d",
            });

            res.json({
                token,
                user: { id: user._id, email: user.email },
            });
        } catch (err) {
            console.error("Login error:", err);
            res.status(500).json({ message: "Server error during login" });
        }
    });

    // GET /api/auth/me - Get current user
    router.get("/me", authMiddleware, async (req, res) => {
        try {
            const user = await usersCollection.findOne({ _id: new ObjectId(req.userId) });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.json({
                user: { id: user._id, email: user.email },
            });
        } catch (err) {
            console.error("Get user error:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // PUT /api/auth/password - Change password
    router.put("/password", authMiddleware, validate(changePasswordSchema), async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            const user = await usersCollection.findOne({ _id: new ObjectId(req.userId) });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                return res.status(401).json({ message: "Current password is incorrect" });
            }

            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            await usersCollection.updateOne(
                { _id: new ObjectId(req.userId) },
                { $set: { passwordHash: newPasswordHash } }
            );

            res.json({ message: "Password updated successfully" });
        } catch (err) {
            console.error("Change password error:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    return router;
};
