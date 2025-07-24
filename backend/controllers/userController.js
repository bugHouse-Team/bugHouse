const User = require('../models/User');

// POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { email, name, idNumber, gradeLevel, role } = req.body;

    if (!email || !name || !idNumber || !gradeLevel || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { idNumber }] });
    if (existing) {
      return res.status(400).json({ message: 'Email or ID Number already exists' });
    }

    const user = new User({ email, name, idNumber, gradeLevel, role });
    await user.save();

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (
      req.user.role !== "Admin" &&
      req.user.role !== "SysAdmin"
    ) {
      const users = await User.findById(req.user.id);
      return res.status(201).json(users);
    }
    
    const users = email
      ? await User.find({ email })
      : await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// GET /api/users/email/:email
exports.getUserByEmail = async (req, res) => {
  try {
    
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (
      req.user.role !== "Admin" &&
      req.user.role !== "SysAdmin" &&
      req.user.id !== user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user by email' });
  }
};

// GET /api/users/:userId
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Allow only Admins or the user themselves
    if (
      req.user.role !== "Admin" &&
      req.user.role !== "SysAdmin" &&
      req.user.id !== user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user by ID" });
  }
};

// PUT /api/users/:userId
exports.updateUser = async (req, res) => {
  try {

    // Allow only Admins or the user themselves
    if (
      req.user.role !== "Admin" &&
      req.user.role !== "SysAdmin" &&
      req.user.id !== req.params.userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findByIdAndUpdate(req.params.userId, req.body, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// DELETE /api/users/:userId
exports.deleteUser = async (req, res) => {
  try {
    if (
      req.user.role !== "Admin" &&
      req.user.role !== "SysAdmin" &&
      req.user.id !== req.params.userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await User.findByIdAndDelete(req.params.userId);
    if (!result) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// POST /api/users/verify-id  (WE PROBABLY DON'T NEED THIS)
exports.verifyIdNumber = async (req, res) => {
  try {
    const { email, idNumber } = req.body;
    if (!email || !idNumber) {
      return res.status(400).json({ message: 'Email and ID Number are required' });
    }

    const user = await User.findOne({ email, idNumber });
    if (!user) {
      return res.status(400).json({ message: '❌ ID Number does not match our records' });
    }

    res.status(200).json({ message: '✅ ID verified successfully' });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { idNumber } = req.params;
    const { role }     = req.body;

    // Validate role early (keeps DB hit small if invalid)
    if (!["Student", "Tutor", "Admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'Student' or 'Tutor'." });
    }

    if (
      req.user.role !== "Admin" &&
      req.user.role !== "SysAdmin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findOneAndUpdate(
      { idNumber },                  // query
      { role },                      // update
      { new: true }                  // return the updated doc
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);                  // 200 OK with updated user
  } catch (err) {
    
  }
};