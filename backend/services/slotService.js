function generateSlots(availability, weeksAhead = 4, slotDuration = 30) {
    const slots = [];
    const dayIndexMap = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6
    };
    const today = new Date();
  
    availability.weeklySchedule.forEach(({ day, blocks }) => {
      const dayIndex = dayIndexMap[day];
  
      for (let i = 0; i < weeksAhead; i++) {
        const baseDate = new Date(today);
        baseDate.setDate(baseDate.getDate() + ((7 * i) + ((dayIndex - baseDate.getDay() + 7) % 7)));
  
        blocks.forEach(({ startTime, endTime, subjects }) => {
          const [startH, startM] = startTime.split(":").map(Number);
          const [endH, endM] = endTime.split(":").map(Number);
  
          let start = new Date(baseDate);
          start.setHours(startH, startM, 0, 0);
  
          const end = new Date(baseDate);
          end.setHours(endH, endM, 0, 0);
  
          while (start < end) {
            const next = new Date(start.getTime() + slotDuration * 60000);
  
            // Only one slot per time block, but with multiple subjects
            slots.push({
              tutorId: availability.tutorId,
              subjects, // attach all subjects to one slot
              date: new Date(start),
              day,
              startTime: start.toTimeString().slice(0, 5),
              endTime: next.toTimeString().slice(0, 5),
              isBooked: false,
              studentId: null
            });
  
            start = next;
          }
        });
      }
    });
  
    return slots;
  }
  
module.exports = generateSlots;
  