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
const profileRoutes = require('./routes/profile');


// Mount your routes here
app.use('/api/users', userRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoute);
app.use('/api/slots', slotRoute);
app.use('/api/profile', profileRoutes);


app.use((err, req, res, next) => {
  console.error("💥 Global error caught:", err);
  
  if (!res.headersSent) {
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message || err,
    });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));