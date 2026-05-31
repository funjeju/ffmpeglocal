import React from 'react';
import { Type } from 'lucide-react';

interface SubtitleUIProps {
  subColor: string;
  setSubColor: (c: string) => void;
  subSize: number;
  setSubSize: (s: number) => void;
  subPos: 'top' | 'bottom' | 'center';
  setSubPos: (p: 'top' | 'bottom' | 'center') => void;
}

export default function SubtitleUI({ subColor, setSubColor, subSize, setSubSize, subPos, setSubPos }: SubtitleUIProps) {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Type size={20} style={{ color: 'var(--primary)' }} /> Subtitle Styling
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--text-muted)' }}>Color</label>
          <input 
            type="color" 
            value={subColor} 
            onChange={(e) => setSubColor(e.target.value)} 
            style={{ width: '100%', height: '40px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--text-muted)' }}>Size</label>
          <input 
            type="number" 
            className="text-input" 
            value={subSize} 
            onChange={(e) => setSubSize(Number(e.target.value))} 
            min={10} max={100}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--text-muted)' }}>Position</label>
        <select className="select-input" value={subPos} onChange={(e) => setSubPos(e.target.value as any)}>
          <option value="top">Top</option>
          <option value="center">Center</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>
    </div>
  );
}
