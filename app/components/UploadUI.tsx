import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, Mic } from 'lucide-react';

interface UploadUIProps {
  onImagesSelect: (files: File[]) => void;
  onAudioSelect: (file: File) => void;
}

export default function UploadUI({ onImagesSelect, onAudioSelect }: UploadUIProps) {
  const [images, setImages] = useState<File[]>([]);
  const [audio, setAudio] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).slice(0, 20);
      setImages(selected);
      onImagesSelect(selected);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudio(e.target.files[0]);
      onAudioSelect(e.target.files[0]);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={20} style={{ color: 'var(--primary)' }} /> Images (5-20)
        </h3>
        <label className="upload-area" style={{ display: 'block' }}>
          <input type="file" multiple accept="image/*" className="input-file" onChange={handleImageChange} />
          <UploadCloud size={32} style={{ margin: '0 auto 10px', color: 'var(--primary)' }} />
          <p>{images.length > 0 ? `${images.length} images selected` : 'Click or Drag images here'}</p>
        </label>
      </div>

      <div>
        <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mic size={20} style={{ color: 'var(--primary)' }} /> Voice Audio
        </h3>
        <label className="upload-area" style={{ display: 'block', padding: '20px' }}>
          <input type="file" accept="audio/*" className="input-file" onChange={handleAudioChange} />
          <UploadCloud size={24} style={{ margin: '0 auto 10px', color: 'var(--primary)' }} />
          <p>{audio ? audio.name : 'Select audio file'}</p>
        </label>
      </div>
    </div>
  );
}
