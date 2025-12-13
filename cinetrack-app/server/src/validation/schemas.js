const { z } = require("zod");

const registerSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    inviteCode: z.string().min(1, "Invite code is required"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const watchlistItemSchema = z.object({
    id: z.number({ message: "ID must be a number" }),
    media_type: z.enum(["movie", "tv"], { message: "media_type must be 'movie' or 'tv'" }),
}).passthrough();

const watchlistImportSchema = z.array(watchlistItemSchema);

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    watchlistItemSchema,
    watchlistImportSchema,
};
