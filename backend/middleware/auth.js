// middleware/auth.js
const admin = require("../firebaseAdmin");
const User = require("../models/User");

const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const idToken = authHeader.split("Bearer ")[1];
 
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;

    // Lookup user in your MongoDB
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(403).json({ message: "User not found in database" });
    }

    if (user.role !== "Admin" && user.role !== "SysAdmin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // Attach user info to request
    req.user = user;
    next();
  } catch (err) {
    console.error("Token verification failed", err);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = {
  verifyAdmin,
};
