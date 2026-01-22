const jwt = require("jsonwebtoken");
const config = require("../config");

const JWT_SECRET = config.jwt.secret;
const COOKIE_NAME = "scenestack_token";
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const demoCookieOptions = {
  ...cookieOptions,
  maxAge: 4 * 60 * 60 * 1000,
};

const setTokenCookie = (res, token, isDemo = false) => {
  res.cookie(COOKIE_NAME, token, isDemo ? demoCookieOptions : cookieOptions);
};

const clearTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
};

const authMiddleware = (req, res, next) => {
  let token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    clearTokenCookie(res);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { authMiddleware, JWT_SECRET, COOKIE_NAME, setTokenCookie, clearTokenCookie };
