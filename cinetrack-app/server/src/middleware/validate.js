const { z } = require("zod");

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const messages = result.error.issues.map((e) => e.message).join(", ");
        return res.status(400).json({ message: messages });
    }
    next();
};

module.exports = { validate };
