const express = require('express');
const router = express.Router();
const { verifyAdmin, authenticate } = require("../middleware/auth");
const {
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser,
  deleteUser,
  updateRole
} = require('../controllers/userController');

// User Management
router.post('/', createUser);                      // Create new user
router.get('/', verifyAdmin, getAllUsers);                      // Get all users or filter by ?email=
router.get('/email/:email',authenticate, getUserByEmail);       // Get user by email
router.get('/:userId',authenticate, getUserById);               // Get user by ID
router.put('/:userId',authenticate, updateUser);                // Update user
router.delete('/:userId',authenticate, deleteUser);             // Delete user
router.patch('/:idNumber/role',authenticate, updateRole);


module.exports = router;
