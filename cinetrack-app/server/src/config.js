const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const required = ["MONGO_URI", "JWT_SECRET", "INVITE_CODES"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(", ")}`);
    console.error("Check your .env file and ensure all required variables are set.");
    process.exit(1);
}

module.exports = {
    mongo: {
        uri: process.env.MONGO_URI,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
    },
    inviteCodes: process.env.INVITE_CODES.split(",").map((c) => c.trim()).filter(Boolean),
    port: parseInt(process.env.PORT, 10) || 3001,
};
