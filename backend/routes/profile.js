// routes/profile.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const User = require("../models/User");

// Configure persistent upload directory
const UPLOAD_BASE = '/persistent/uploads';
const PROFILE_IMAGES_DIR = path.join(UPLOAD_BASE, 'profile-images');

// Ensure directory exists
if (!fs.existsSync(PROFILE_IMAGES_DIR)) {
  fs.mkdirSync(PROFILE_IMAGES_DIR, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PROFILE_IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${req.params.email}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload Profile Image
router.post("/upload-profile-image/:email", upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const relativePath = path.join('profile-images', req.file.filename);
    
    await User.updateOne(
      { email: req.params.email },
      { $set: { profileImage: relativePath } }
    );

    res.status(200).json({ 
      message: 'Profile image updated successfully',
      imagePath: relativePath
    });
  } catch (err) {
    console.error('Upload error:', err);
    
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({ 
      message: 'Error uploading image',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get User Data
router.get("/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const responseData = {
      email: user.email,
      name: user.name,
      idNumber: user.idNumber.trim(),
      role: user.role
    };

    if (user.profileImage) {
      responseData.profileImage = `${req.protocol}://${req.get('host')}/uploads/${user.profileImage.replace(/\\/g, '/')}`;
    }

    res.status(200).json(responseData);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Save User Info
router.post("/save-info", async (req, res) => {
  try {
    const { email, name, idNumber, gradeLevel, role } = req.body;

    if (!email || !name || !idNumber || !gradeLevel || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { idNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or ID Number already exists" });
    }

    const user = new User({ email, name, idNumber, gradeLevel, role });
    await user.save();
    res.status(201).json({ message: "User added successfully!" });
  } catch (err) {
    console.error("Error saving user:", err);
    res.status(500).json({ message: "Error saving data", error: err.message });
  }
});

// Verify ID
router.post("/verify-id", async (req, res) => {
  try {
    const { email, idNumber } = req.body;

    const user = await User.findOne({ email, idNumber });
    if (!user) {
      return res.status(400).json({ message: "ID Number does not match our records" });
    }

    res.status(200).json({ message: "ID verified successfully" });
  } catch (err) {
    console.error("Error verifying ID:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;