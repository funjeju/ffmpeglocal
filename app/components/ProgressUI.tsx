import React from 'react';

interface ProgressUIProps {
  progress: number;
  message: string;
}

export default function ProgressUI({ progress, message }: ProgressUIProps) {
  return (
    <div className="glass-panel" style={{ textAlign: 'center' }}>
      <h3 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>{message}</h3>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <p style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '14px' }}>
        {progress}%
      </p>
    </div>
  );
}
