import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/AvailabilityRequests.css';
import { FaCheck, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function AvailabilityRequests() {
  const [availabilities, setAvailabilities] = useState([]);

  useEffect(() => {
    fetchPendingAvailability();
  }, []);

  const fetchPendingAvailability = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/availability/pending`);
      setAvailabilities(res.data);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
      toast.error('Failed to fetch pending availability requests.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`${API_URL}/api/admin/availability/${id}/approve`);
      setAvailabilities(prev => prev.filter(a => a._id !== id));
      toast.success('Availability request approved successfully');
    } catch (err) {
      console.error('Approval failed:', err);
      toast.error('Failed to approve availability request');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/admin/availability/${id}`);
      setAvailabilities(prev => prev.filter(a => a._id !== id));
      toast.success('Availability request deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err.message);
      toast.error('Failed to delete availability request');
    }
  };

  return (
    <section className="availability-container fixed-width">
      <h3 className="availability-title">Pending Availability Approval Requests:</h3>

      {availabilities.length === 0 ? (
        <p className="availability-text">No pending requests.</p>
      ) : (
        <div className="availability-scroll">
          {availabilities.map((item) => (
            <div key={item._id} className="availability-entry">
              <div className="availability-header">
                <span className="tutor-name">{item.tutor?.name || 'Unnamed Tutor'}</span>
                <span className="day-count">{item.weeklySchedule.length} day(s)</span>
              </div>

              <ul className="availability-details">
                {item.weeklySchedule.map((dayItem, i) => (
                  <li key={i}>
                    <strong>{dayItem.day}</strong>:&nbsp;
                    {dayItem.blocks.map((block, j) => (
                      <span key={j} className="time-block">
                        {block.startTime}–{block.endTime} <em>({block.subjects.join(', ')})</em>
                        {j < dayItem.blocks.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>

              <div className="action-buttons">
                <button
                  className="approve"
                  onClick={() => handleApprove(item._id)}
                  title="Approve"
                >
                  <FaCheck />
                </button>

                <button
                  className="deny"
                  onClick={() => handleDelete(item._id)}
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
