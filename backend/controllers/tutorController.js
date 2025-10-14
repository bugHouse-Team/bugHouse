const TutorAvailability = require('../models/TutorAvailability');
const User = require('../models/User');
const Slot = require('../models/Slot');
const mongoose = require('mongoose');

// POST /api/tutors/:tutorId/availability
exports.createAvailability = async (req, res) => {
  try {
    const { weeklySchedule } = req.body;
    const tutorId = req.params.tutorId;

    if (
      req.user.role !== "Tutor" &&
      req.user.role !== "SysAdmin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      req.user.role !== "SysAdmin" &&
      req.params.tutorId !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const existing = await TutorAvailability.findOne({ tutorId });

    if (existing) {
      console.log("Existing availability found:", existing);
    }

    const newAvailability = new TutorAvailability({ tutorId, weeklySchedule });
    await newAvailability.save();

    res.status(201).json(newAvailability);
  } catch (err) {
    console.error("Server error in createAvailability:", err);
    res.status(500).json({ error: err.message });
  }
};


// DELETE /api/tutors/:tutorId/availability
exports.deleteAvailability = async (req, res) => {
    try {
      const tutorId = req.params.tutorId;
      
    if (
      req.user.role !== "Tutor" &&
      req.user.role !== "SysAdmin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      req.user.role !== "SysAdmin" &&
      req.params.tutorId !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
      // 1. Delete availability
      const deletedAvailability = await TutorAvailability.findOneAndDelete({ tutorId });
      if (!deletedAvailability) {
        return res.status(404).json({ message: 'Availability not found for this tutor' });
      }
  
      // 2. Delete all slots tied to that tutor
      const deleteResult = await Slot.deleteMany({ tutorId });
  
      res.status(200).json({
        message: 'Availability and related slots deleted successfully',
        deletedSlotsCount: deleteResult.deletedCount
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error during deletion' });
    }
};

// GET /api/tutors/:tutorId/availability (can be used for filter)
exports.getAvailabilityByTutor = async (req, res) => {
  try {
    const tutorId = req.params.tutorId;
    if (!tutorId) {
      return res.status(400).json({ message: "Missing tutorId parameter." });
    }

    try
    {
      const availability = await TutorAvailability.find({ tutorId: req.params.tutorId });

      if (!availability || availability.length === 0) {
        return res.status(404).json({ message: "No availability found for this tutor." });
      }

      res.status(200).json(availability);
    } catch (err)
    {
      const user = await User.findOne({idNumber: tutorId});

      if(user)
      {
        const availability = await TutorAvailability.find({ tutorId: user._id });

        if (!availability || availability.length === 0) {
          return res.status(404).json({ message: "No availability found for this tutor." });
        }

        res.status(200).json(availability);
      } else
      {
        return res.status(404).json({ message: "User not found." });
      }
    }

  } catch (err) {
    console.error("❌ Error fetching availability:", err);
    res.status(500).json({ error: err.message });
  }
};


// GET /api/tutors/:tutorId/bookings
exports.getTutorBookings = async (req, res) => {
  try {
    const bookings = await Slot.find({
      tutorId: req.params.tutorId,
      isBooked: true
    }).populate('studentId');

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch tutor bookings' });
  }
};

// GET /api/tutors/:tutorId/report
exports.getTutorReport = async (req, res) => {
  try {
    const tutorId = req.params.tutorId;

    // Fetch all booked sessions for the tutor
    const sessions = await Slot.find({ tutorId, isBooked: true });

    // Total sessions conducted
    const totalSessions = sessions.length;

    // Unique students helped
    const uniqueStudentIds = new Set(sessions.map(s => s.studentId?.toString()));
    const totalStudents = uniqueStudentIds.size;

    // Aggregate all subjects taught
    const allSubjects = sessions.flatMap(s => s.subjects || []);
    const uniqueSubjects = [...new Set(allSubjects)];

    // Return the report
    res.json({
      totalSessions,
      totalStudents,
      subjects: uniqueSubjects,
      averageRating: 5.0 // Hardcoded for now
    });

  } catch (err) {
    console.error("Error generating tutor report:", err);
    res.status(500).json({ message: "Failed to generate tutor report." });
  }
};

// GET /api/tutors
exports.getAllTutors = async (req, res) => {
  try {
    const tutors = await User.find({ role: { $in: ['Tutor', 'SysAdmin'] } });
    res.json(tutors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch tutors' });
  }
};

// GET /api/tutors/subjects
exports.getSubjects = async (req, res) => {
  try {
    const users = await User.find(
      { role: { $in: ['Tutor', 'SysAdmin'] } },
      '_id'
    );

    const tutorIds = users.map(u => u._id);

    const subjects = await TutorAvailability.distinct(
      'weeklySchedule.blocks.subjects',
      { tutorId: { $in: tutorIds }, isApproved: true }
    );

    res.json(subjects.filter(Boolean).sort());
  } catch (err) {
    console.error('❌ Error fetching subjects:', err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

// GET /api/tutors/slots
exports.getSlots = async (req, res) => {
  try {
    const { date, tutorEmail, subject } = req.query;

    if (!date) return res.status(400).json({ message: "Missing date parameter." });

    const parsedDate = new Date(new Date(date).toLocaleString("en-US", {
      timeZone: "America/Chicago",
    }));

    const dayString = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][parsedDate.getDay()];

    let availabilities;
    if (tutorEmail) {
      availabilities = await TutorAvailability.aggregate([
        { $match: { isApproved: true, 'weeklySchedule.day': dayString } },
        {
          $lookup: {
            from: 'users',
            localField: 'tutorId',
            foreignField: '_id',
            as: 'tutor'
          }
        },
        { $unwind: '$tutor' },
        { $match: { 'tutor.email': tutorEmail } }
      ]);
    } else {
      availabilities = await TutorAvailability.find({
        isApproved: true,
        'weeklySchedule.day': dayString
      });
    }

    console.log(req.query);

    console.log(availabilities);

    const slots = [];
    for (const avail of availabilities) {
      const schedules = avail.weeklySchedule.filter(b => b.day === dayString);
      
      for(const schedule of schedules) {
        for (const block of schedule.blocks) {
          if(subject && !block.subjects.includes(subject)) continue;
          
          let [hour, minute] = block.startTime.split(":").map(Number);

          const startTime = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), hour, minute);

          [hour, minute] = block.endTime.split(":").map(Number);

          const endTime = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), hour, minute);
          
          const slotDuration = 30;
          
          while (startTime < endTime) {
            const slotExists = await Slot.findOne({
              tutorId: avail.tutorId,
              date: startTime.toISOString(),
              startTime: startTime.toISOString().substring(11,16),
              endTime: new Date(startTime.getTime() + slotDuration*60000).toISOString().substring(11,16)
            });

            if (!slotExists) {
              const tutor = await User.findOne({ _id: avail.tutorId });

              slots.push({
                tutorId: tutor,
                date: startTime.toISOString(),
                startTime: startTime.toISOString().substring(11,16),
                endTime: new Date(startTime.getTime() + slotDuration*60000).toISOString().substring(11,16),
                subjects: block.subjects,
                isBooked: false,
                id: new mongoose.Types.ObjectId()
              });
            }

            startTime.setMinutes(startTime.getMinutes() + slotDuration);
          }
        }
      }
      
    }

    res.json(slots);

  } catch (err) {
    console.error('❌ Error fetching slots:', err);
    res.status(500).json({ message: 'Failed to fetch slots' });
  }
};


// GET /api/tutors/:tutorId
exports.getTutorById = async (req, res) => {
  try {
    const tutor = await User.findOne({ _id: req.params.tutorId, role: 'Tutor' });
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
    res.json(tutor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch tutor' });
  }
};

// PATCH /api/tutors/:tutorId
exports.updateTutor = async (req, res) => {
  try {
    if (
      req.user.role !== "Tutor" &&
      req.user.role !== "SysAdmin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      req.user.role !== "SysAdmin" &&
      req.params.tutorId !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updates = req.body;
    const tutor = await User.findOneAndUpdate(
      { _id: req.params.tutorId, role: 'Tutor' },
      updates,
      { new: true }
    );

    if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
    res.json({ message: 'Tutor updated', tutor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating tutor' });
  }
};

// DELETE /api/tutors/:tutorId
exports.deleteTutor = async (req, res) => {
  try {
    if (
      req.user.role !== "SysAdmin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      req.user.role !== "SysAdmin" &&
      req.params.tutorId !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const tutor = await User.findOneAndDelete({ _id: req.params.tutorId, role: 'Tutor' });
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
    res.json({ message: 'Tutor deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting tutor' });
  }
};
