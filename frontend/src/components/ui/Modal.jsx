import React, { useEffect } from "react";
import "../../styles/modal.css";

const Modal = ({ isOpen, onClose, title, children }) => {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modalBackdrop">
      <div className="modalContent">
        <div className="modalHeader">
          <h2 className="modalTitle">{title}</h2>
          <button onClick={onClose} className="modalClose">✖</button>
        </div>

        <div className="modalBody">{children}</div>

        <button onClick={onClose} className="closeButton">
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
