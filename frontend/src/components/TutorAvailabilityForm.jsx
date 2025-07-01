import React, { useState } from 'react';
import axios from 'axios';
import Button from './ui/Button';
import { MdDelete } from "react-icons/md";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import '../styles/TutorAvailabilityForm.css';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TutorAvailabilityForm({ tutorId, onClose }) {
  const [schedule, setSchedule] = useState(
    daysOfWeek.map(day => ({
      day,
      blocks: [{ startTime: '', endTime: '', subjects: '' }]
    }))
  );

  const [isFormValid, setIsFormValid] = useState(false);

  const validateSchedule = (data) => {
    let isAnyValid = false;
    let isAllValid = true;

    const weeklySchedule = data.map(dayItem => {
      const blocks = dayItem.blocks;
      const validBlocks = [];

      for (let i = 0; i < blocks.length; i++) {
        const current = blocks[i];
        const start = current.startTime;
        const end = current.endTime;
        const subjectArray = current.subjects.split(',').map(s => s.trim()).filter(Boolean);

        const isValid = start && end && start < end && subjectArray.length > 0;

        const overlaps = validBlocks.some(b =>
          (start < b.endTime && end > b.startTime)
        );

        if (isValid && !overlaps) {
          validBlocks.push({ startTime: start, endTime: end, subjects: subjectArray });
        } else if (start || end || subjectArray.length > 0) {
          isAllValid = false;
        }
      }

      if (validBlocks.length > 0) isAnyValid = true;
      return { day: dayItem.day, blocks: validBlocks };
    });

    setIsFormValid(isAnyValid && isAllValid);
    return weeklySchedule.filter(day => day.blocks.length > 0);
  };

  const handleChange = (dayIndex, blockIndex, field, value) => {
    const updated = [...schedule];
    updated[dayIndex].blocks[blockIndex][field] = value;
    setSchedule(updated);
    validateSchedule(updated);
  };

  const addBlock = (dayIndex) => {
    const updated = [...schedule];
    updated[dayIndex].blocks.push({ startTime: '', endTime: '', subjects: '' });
    setSchedule(updated);
    validateSchedule(updated);
  };

  const deleteBlock = (dayIndex, blockIndex) => {
    const updated = [...schedule];
    if (updated[dayIndex].blocks.length > 1) {
      updated[dayIndex].blocks.splice(blockIndex, 1);
      setSchedule(updated);
      validateSchedule(updated);
    }
  };

  const handleSubmit = async () => {
    const payload = {
      tutorId,
      weeklySchedule: validateSchedule(schedule)
    };

    try {
      await axios.post(`${API_URL}/api/tutors/${tutorId}/availability`, payload);
      toast.success("Availability submitted successfully!");
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Submission failed.';
      toast.error(msg);
    }
  };

  return (
    <div className="availability-form">
      {schedule.map((dayItem, i) => (
        <div key={i} className="day-block">
          <h4>{dayItem.day}</h4>

          {dayItem.blocks.map((block, j) => (
            <div key={j} className="block">
              <div className="field-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={block.startTime}
                  onChange={e => handleChange(i, j, 'startTime', e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={block.endTime}
                  onChange={e => handleChange(i, j, 'endTime', e.target.value)}
                />
              </div>

              <div className="field-group" style={{ flexGrow: 1 }}>
                <label>Subjects</label>
                <input
                  type="text"
                  placeholder="e.g. CSE 1320"
                  value={block.subjects}
                  onChange={e => handleChange(i, j, 'subjects', e.target.value)}
                />
              </div>

              {dayItem.blocks.length > 1 && (
                <button
                  type="button"
                  onClick={() => deleteBlock(i, j)}
                  className="delete-btn"
                  title="Delete Block"
                >
                  <MdDelete />
                </button>
              )}
            </div>
          ))}

          <Button variant="secondary" onClick={() => addBlock(i)}>
            + Add Time Block
          </Button>
        </div>
      ))}

      <div className="submit-btn-container">
        <Button variant="primary" onClick={handleSubmit} disabled={!isFormValid}>
          Submit Availability
        </Button>
      </div>
    </div>
  );
}
