const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  idNumber: {
    type: String,
    required: true,
    unique: true
  },
  gradeLevel: {
    type: String,
    enum: ['Freshman', 'Sophomore', 'Junior', 'Senior'],
    required: true
  },
  role: {
    type: String,
    enum: ['Student', 'Tutor', 'Admin'],
    required: true
  },
  // PROFILE-SPECIFIC ADDITION
  profileImage: {
    type: String
  }
}, {
  timestamps: true
});

// Transform _id -> id and remove __v
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  }
});

module.exports = mongoose.model('User', UserSchema);