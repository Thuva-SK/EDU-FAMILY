import React from 'react';
import { useData } from '../context/DataContext';

export default function Toast() {
  const { toastMessage } = useData();

  if (!toastMessage) return null;

  return (
    <div className="toast show" role="status" aria-live="polite">
      {toastMessage}
    </div>
  );
}
