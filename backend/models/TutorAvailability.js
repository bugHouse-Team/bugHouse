const mongoose = require('mongoose');

const TutorAvailabilitySchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weeklySchedule: [
    {
      day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], required: true },
      blocks: [
        {
          startTime: { type: String, required: true }, // "10:00"
          endTime: { type: String, required: true },   // "12:00"
          subjects: [String] // ["CSE 1320"]
        }
      ]
    }
  ],
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
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

module.exports = mongoose.model('TutorAvailability', TutorAvailabilitySchema);


// for cleaner request response with no duplicate id

// const BlockSchema = new mongoose.Schema({
//   startTime: String,
//   endTime: String,
//   subjects: [String]
// }, {
//   _id: true, // Keeps unique _id for each block
//   toJSON: {
//     transform: (doc, ret) => {
//       ret.id = ret._id;
//       delete ret._id;
//     }
//   }
// });

// const WeeklyScheduleSchema = new mongoose.Schema({
//   day: String,
//   blocks: [BlockSchema]
// }, {
//   _id: true,
//   toJSON: {
//     transform: (doc, ret) => {
//       ret.id = ret._id;
//       delete ret._id;
//     }
//   }
// });

// const TutorAvailabilitySchema = new mongoose.Schema({
//   tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   weeklySchedule: [WeeklyScheduleSchema],
//   isApproved: { type: Boolean, default: false }
// }, {
//   timestamps: true,
//   toJSON: {
//     virtuals: true,
//     transform: (doc, ret) => {
//       ret.id = ret._id;
//       delete ret._id;
//       delete ret.__v;
//     }
//   }
// });

