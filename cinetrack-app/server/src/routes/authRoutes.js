const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Valid invite codes from environment
const INVITE_CODES = (process.env.INVITE_CODES).split(",").map(c => c.trim());

module.exports = (usersCollection) => {
    // POST /api/auth/register
    router.post("/register", async (req, res) => {
        try {
            const { email, password, inviteCode } = req.body;

            // Validate input
            if (!email || !password || !inviteCode) {
                return res.status(400).json({ message: "Email, password, and invite code are required" });
            }

            // Validate invite code
            if (!INVITE_CODES.includes(inviteCode)) {
                return res.status(403).json({ message: "Invalid invite code" });
            }

            // Check if user exists
            const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(409).json({ message: "Email already registered" });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const result = await usersCollection.insertOne({
                email: email.toLowerCase(),
                passwordHash,
                createdAt: new Date(),
            });

            // Generate token
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
    router.post("/login", async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            // Find user
            const user = await usersCollection.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (!isValid) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            // Generate token
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
            const { ObjectId } = require("mongodb");
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
    router.put("/password", authMiddleware, async (req, res) => {
        try {
            const { ObjectId } = require("mongodb");
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: "Current and new password are required" });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ message: "New password must be at least 6 characters" });
            }

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
