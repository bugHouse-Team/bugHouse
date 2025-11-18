const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjects: { type: [String], required: true }, // Multiple subjects for one time block
  day: String,
  date: Date,
  startTime: String,
  endTime: String,
  isBooked: { type: Boolean, default: false },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('Slot', SlotSchema);
