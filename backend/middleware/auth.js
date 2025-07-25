// middleware/auth.js
const admin = require("../firebaseAdmin");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized. Missing header." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  if(idToken.length == 0 || idToken === "undefined" || idToken === "null") {
    return res.status(302).json({ message: "Unauthorized. Invalid token." });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Authentication error:", err);

    if (err.code === "auth/id-token-expired") {
      return res.status(302).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Unauthorized", error: err.message });
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