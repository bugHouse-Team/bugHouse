// middleware/auth.js
const admin = require("../firebaseAdmin");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Redirect if token is missing or badly formatted
    return res.status(401).json({ message: "Unauthorized. Missing header." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;

    const user = await User.findOne({ email });

    if (!user) {
      // Redirect if user is not found in your database
      res.status(302).json({ message: "Unauthorized", idToken });
    }

    req.user = user; // include role, email, idNumber, etc.
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    // Redirect if token verification fails
    res.status(302).json({ message: "Unauthorized", idToken });
  }
};

const verifyAdmin = async (req, res, next) => {
  await authenticate(req, res, async () => {
    if (req.user.role !== "Admin" && req.user.role !== "SysAdmin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
  });
};

module.exports = {
  authenticate,
  verifyAdmin,
};