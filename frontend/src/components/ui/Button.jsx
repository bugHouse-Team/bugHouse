import React from 'react';
import '../../styles/Button.css';

export default function Button({ children, variant = "primary", ...props }) {
  return (
    <button className={`uta-btn uta-btn-${variant}`} {...props}>
      {children}
    </button>
  );
}