import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, Mic, LayoutTemplate } from 'lucide-react';

interface UploadUIProps {
  onImagesSelect: (files: File[]) => void;
  onAudioSelect: (file: File) => void;
  onThumbnailSelect: (file: File | null) => void;
  onCtaSelect: (file: File | null) => void;
}

export default function UploadUI({ onImagesSelect, onAudioSelect, onThumbnailSelect, onCtaSelect }: UploadUIProps) {
  const [images, setImages] = useState<File[]>([]);
  const [audio, setAudio] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [cta, setCta] = useState<File | null>(null);

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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
      onThumbnailSelect(e.target.files[0]);
    }
  };

  const handleCtaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCta(e.target.files[0]);
      onCtaSelect(e.target.files[0]);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <h3 style={{ marginBottom: '10px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutTemplate size={18} style={{ color: 'var(--primary)' }} /> Thumbnail (Optional)
          </h3>
          <label className="upload-area" style={{ display: 'block', padding: '15px' }}>
            <input type="file" accept="image/*" className="input-file" onChange={handleThumbnailChange} />
            {thumbnail ? (
              <img src={URL.createObjectURL(thumbnail)} alt="Thumbnail" style={{ width: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }} />
            ) : (
              <p style={{ fontSize: '14px' }}>Select Image</p>
            )}
          </label>
        </div>
        <div>
          <h3 style={{ marginBottom: '10px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutTemplate size={18} style={{ color: 'var(--primary)' }} /> Final CTA (Optional)
          </h3>
          <label className="upload-area" style={{ display: 'block', padding: '15px' }}>
            <input type="file" accept="image/*" className="input-file" onChange={handleCtaChange} />
            {cta ? (
              <img src={URL.createObjectURL(cta)} alt="CTA" style={{ width: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }} />
            ) : (
              <p style={{ fontSize: '14px' }}>Select Image</p>
            )}
          </label>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={20} style={{ color: 'var(--primary)' }} /> Main Images (5-20)
        </h3>
        <label className="upload-area" style={{ display: 'block' }}>
          <input type="file" multiple accept="image/*" className="input-file" onChange={handleImageChange} />
          <UploadCloud size={32} style={{ margin: '0 auto 10px', color: 'var(--primary)' }} />
          <p>{images.length > 0 ? `${images.length} images selected` : 'Click or Drag images here'}</p>
        </label>
        {images.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '15px', paddingBottom: '5px' }}>
            {images.map((file, i) => (
              <img key={i} src={URL.createObjectURL(file)} alt={`Img ${i}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)', flexShrink: 0 }} />
            ))}
          </div>
        )}
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
