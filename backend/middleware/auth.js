// middleware/auth.js
const admin = require("../firebaseAdmin");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized. Missing header." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    if (!idToken || idToken === "undefined" || idToken === "null") {
      return res.status(401).json({ message: "Unauthorized. Invalid token." });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;

    const user = await User.findOne({ email }).lean(); // lean() returns plain object
    if (!user) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    // Send proper 401 instead of crashing
    return res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};

const verifyAdmin = async (req, res, next) => {
  // Call authenticate first
  await authenticate(req, res, () => {
    if (req.user.role !== "Admin" && req.user.role !== "SysAdmin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
  });
};

module.exports = { authenticate, verifyAdmin };
