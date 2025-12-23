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
const DEMO_CODE = config.demoCode;

module.exports = (usersCollection, demoUsersCollection) => {
    const findUser = async (query) => {
        let user = await usersCollection.findOne(query);
        if (user) return { user, isDemo: false };

        user = await demoUsersCollection.findOne(query);
        if (user) return { user, isDemo: true };

        return { user: null, isDemo: false };
    };

    const getCollectionForUser = async (userId) => {
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (user) return { collection: usersCollection, user, isDemo: false };

        const demoUser = await demoUsersCollection.findOne({ _id: new ObjectId(userId) });
        if (demoUser) return { collection: demoUsersCollection, user: demoUser, isDemo: true };

        return { collection: null, user: null, isDemo: false };
    };

    // POST /api/auth/register
    router.post("/register", validate(registerSchema), async (req, res) => {
        try {
            const { email, password, inviteCode } = req.body;
            const isDemo = inviteCode === DEMO_CODE;

            if (!isDemo && !INVITE_CODES.includes(inviteCode)) {
                return res.status(403).json({ message: "Invalid invite code" });
            }

            const { user: existingUser } = await findUser({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(409).json({ message: "Email already registered" });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const collection = isDemo ? demoUsersCollection : usersCollection;

            const result = await collection.insertOne({
                email: email.toLowerCase(),
                passwordHash,
                createdAt: new Date(),
            });

            const tokenExpiry = isDemo ? "4h" : "7d";
            const token = jwt.sign({ userId: result.insertedId.toString() }, JWT_SECRET, {
                expiresIn: tokenExpiry,
            });

            res.status(201).json({
                message: "Account created successfully",
                token,
                user: { id: result.insertedId, email: email.toLowerCase(), isDemo },
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

            const { user, isDemo } = await findUser({ email: email.toLowerCase() });
            if (!user) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (!isValid) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            const tokenExpiry = isDemo ? "4h" : "7d";
            const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
                expiresIn: tokenExpiry,
            });

            res.json({
                token,
                user: { id: user._id, email: user.email, isDemo },
            });
        } catch (err) {
            console.error("Login error:", err);
            res.status(500).json({ message: "Server error during login" });
        }
    });

    // GET /api/auth/me - Get current user
    router.get("/me", authMiddleware, async (req, res) => {
        try {
            const { user, isDemo } = await getCollectionForUser(req.userId);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.json({
                user: { id: user._id, email: user.email, isDemo },
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
            const { collection, user, isDemo } = await getCollectionForUser(req.userId);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (isDemo) {
                return res.status(403).json({ message: "Demo accounts cannot change password" });
            }

            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                return res.status(401).json({ message: "Current password is incorrect" });
            }

            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            await collection.updateOne(
                { _id: new ObjectId(req.userId) },
                { $set: { passwordHash: newPasswordHash } }
            );

            res.json({ message: "Password updated successfully" });
        } catch (err) {
            console.error("Change password error:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // DELETE /api/auth - Delete account 
    router.delete("/", authMiddleware, async (req, res) => {
        try {
            const { collection, user, isDemo } = await getCollectionForUser(req.userId);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (isDemo) {
                return res.status(403).json({ message: "Demo accounts are deleted automatically" });
            }

            const userResult = await collection.deleteOne({ _id: new ObjectId(req.userId) });
            if (userResult.deletedCount === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(204).send();
        } catch (err) {
            console.error("Delete account error:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    return router;
};
