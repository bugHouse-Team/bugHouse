const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Serve uploaded profile images
app.use('/uploads', express.static('/persistent/uploads'));

// Connect to DB
connectDB();

// ROUTES 
const userRoutes = require('./routes/user');    
const tutorRoutes = require('./routes/tutor');  
const adminRoutes = require('./routes/admin');
const slotRoute = require('./routes/slot');
const studentRoute = require('./routes/student');
const profileRoutes = require('./routes/profile'); // NEW PROFILE ROUTES


// Mount your routes here
app.use('/api/users', userRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoute);
app.use('/api/slots', slotRoute);
app.use('/api/profile', profileRoutes); // NEW MOUNT POINT




app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));





// 🔹 Middleware to Check Role (NOT SURE WHERE THIS MIDDLEWARE IS USED)
// async function checkRole(req, res, next) {
//   try {
//     const user = await User.findOne({ email: req.body.email });
//     if (!user) {
//       return res.status(404).json({ message: "❌ User not found" });
//     }

//     if (user.role !== req.role) {
//       return res.status(403).json({ message: "❌ Forbidden: Incorrect role" });
//     }

//     next();
//   } catch (error) {
//     console.error("Error checking role:", error);
//     res.status(500).json({ message: "❌ Server error", error: error.message });
//   }
// }
