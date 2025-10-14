const Slot = require('../models/Slot');

// GET /api/slots
exports.getAvailableSlots = async (req, res) => {
  try {
    const { subject } = req.query;
    const query = { isBooked: false };
    if (subject) query.subject = subject;

    const slots = await Slot.find(query).populate('tutorId');
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching slots' });
  }
};

// GET /api/slots/:slotId
exports.getSlotById = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.slotId).populate('tutorId');
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    res.json(slot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching slot' });
  }
};

// DELETE /api/slots/:slotId
exports.deleteSlot = async (req, res) => {
  try {
    const result = await Slot.findByIdAndDelete(req.params.slotId);
    if (!result) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    res.json({ message: 'Booking cancelled'});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting slot' });
  }
};

// POST /api/slots/book
exports.bookSlot = async (req, res) => {
  try {
    const { studentId, tutorId, startTime, endTime, date, subjects } = req.body;
    
    const slot = await Slot.findOne({tutorId : tutorId, startTime: startTime, endTime: endTime, date: date, isBooked: true});

    if(!slot)
    {
      new Slot({
        studentId: studentId,
        tutorId: tutorId,
        startTime: startTime,
        endTime: endTime,
        date: date,
        subjects: subjects,
        isBooked: true,
      }).save();

      res.json({ message: 'Slot booked!', slot });
    } else
    {
      return res.status(400).json({ message: 'Slot already booked' });
    }

    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error booking slot' });
  }
};
