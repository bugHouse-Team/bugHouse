const express = require('express');
const router = express.Router();
const { verifyAdmin } = require("../middleware/auth");
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
router.get('/email/:email', getUserByEmail);       // Get user by email
router.get('/:userId', getUserById);               // Get user by ID
router.put('/:userId', updateUser);                // Update user
router.delete('/:userId', deleteUser);             // Delete user
router.patch('/:idNumber/role', updateRole);


module.exports = router;
