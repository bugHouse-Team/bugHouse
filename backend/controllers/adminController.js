const TutorAvailability = require('../models/TutorAvailability');
const Slot = require('../models/Slot');


// GET /api/admin/availability/pending
exports.getPendingAvailabilities = async (req, res) => {
  try {
    if (
      req.user.role !== "Admin" &&
      req.user.role !== "SysAdmin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const pending = await TutorAvailability.find({ isApproved: false }).populate('tutorId', 'name email idNumber gradeLevel');
    
    // Normalize tutorId to `tutor` for frontend consistency
    const withTutorInfo = pending.map(avail => ({
      ...avail.toObject(),
      tutor: avail.tutorId,
    }));

    res.json(withTutorInfo);
  } catch (err) {
    console.error('Error fetching pending availabilities:', err);
    res.status(500).json({ message: 'Error fetching pending availabilities' });
  }
};

// PATCH /api/admin/availability/:availabilityId/approve
exports.approveAvailability = async (req, res) => {
  try {
    if (
      req.user.role !== "Admin" &&
      req.user.role !== "SysAdmin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { availabilityId } = req.params;
    const availability = await TutorAvailability.findById(availabilityId);

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    if (availability.isApproved) {
      return res.status(400).json({ message: 'Availability already approved' });
    }

    await TutorAvailability.deleteMany({ tutorId: availability.tutorId, _id: { $ne: availabilityId } });

    availability.isApproved = true;
    await availability.save();

    res.status(200).json({ message: 'Availability approved' });
  } catch (err) {
    console.error('Internal error approving availability:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// DELETE /api/admin/availability/:availabilityId
exports.deleteAvailability = async (req, res) => {
  try {
    if (
      req.user.role !== "Admin" &&
      req.user.role !== "SysAdmin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { availabilityId } = req.params;

    const deleted = await TutorAvailability.findByIdAndDelete(availabilityId);
    if (!deleted) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    // Optionally delete related slots too
    await Slot.deleteMany({ tutorId: deleted.tutorId });

    res.status(200).json({ message: 'Availability and related slots deleted successfully' });
  } catch (err) {
    console.error('Error deleting availability:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/admin/appointments
exports.getAllAppointments = async (req, res) => {
  if (req.user.role !== "Admin" && req.user.role !== "SysAdmin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const bookings = await Slot.find({ isBooked: true })
      .select("_id date startTime subjects studentId tutorId endTime")
      .populate("studentId", "name email")
      .populate("tutorId", "name email")
      .lean();

    const formatted = bookings.map(b => ({
      _id: b._id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      subjects: b.subjects,
      studentId: b.studentId,
      tutorId: b.tutorId,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Error fetching all appointments:", err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};