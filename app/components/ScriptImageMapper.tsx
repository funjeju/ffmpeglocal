import React, { useState } from 'react';
import { WhisperSegment } from '@/lib/whisper';
import { UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';

export interface MappedSegment {
  start: number;
  end: number;
  text: string;
  images: File[];
}

interface Props {
  segments: WhisperSegment[];
  onMappingChange: (mapping: MappedSegment[]) => void;
}

export default function ScriptImageMapper({ segments, onMappingChange }: Props) {
  const [mapping, setMapping] = useState<MappedSegment[]>(
    segments.map(s => ({ start: s.start, end: s.end, text: s.text, images: [] }))
  );

  const [pool, setPool] = useState<File[]>([]);

  const handlePoolUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPool([...pool, ...Array.from(e.target.files)]);
    }
  };

  const handleSegmentUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      updateSegmentImages(index, [...mapping[index].images, ...newImages]);
    }
  };

  const updateSegmentImages = (index: number, newImages: File[]) => {
    const newMapping = [...mapping];
    newMapping[index].images = newImages;
    setMapping(newMapping);
    onMappingChange(newMapping);
  };

  const updateSegmentText = (index: number, newText: string) => {
    const newMapping = [...mapping];
    newMapping[index].text = newText;
    setMapping(newMapping);
    onMappingChange(newMapping);
  };

  const removeImage = (segmentIndex: number, imageIndex: number) => {
    const newImages = [...mapping[segmentIndex].images];
    newImages.splice(imageIndex, 1);
    updateSegmentImages(segmentIndex, newImages);
  };

  const handleDragStart = (e: React.DragEvent, fileIndex: number) => {
    e.dataTransfer.setData('fileIndex', fileIndex.toString());
  };

  const handleDropOnSegment = (e: React.DragEvent, segmentIndex: number) => {
    e.preventDefault();
    const fileIndexStr = e.dataTransfer.getData('fileIndex');
    if (fileIndexStr !== '') {
      const fileIndex = parseInt(fileIndexStr, 10);
      const file = pool[fileIndex];
      
      // Remove from pool
      const newPool = [...pool];
      newPool.splice(fileIndex, 1);
      setPool(newPool);

      // Add to segment
      updateSegmentImages(segmentIndex, [...mapping[segmentIndex].images, file]);
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Direct file drop from OS
      const newImages = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      updateSegmentImages(segmentIndex, [...mapping[segmentIndex].images, ...newImages]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel">
        <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={20} style={{ color: 'var(--primary)' }} /> Image Pool (Drag from here)
        </h3>
        <label className="upload-area" style={{ display: 'block', padding: '15px' }}>
          <input type="file" multiple accept="image/*" className="input-file" onChange={handlePoolUpload} />
          <UploadCloud size={24} style={{ margin: '0 auto 5px', color: 'var(--primary)' }} />
          <p style={{ fontSize: '14px' }}>Click to upload images to the pool</p>
        </label>

        {pool.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '15px', paddingBottom: '10px' }}>
            {pool.map((file, i) => (
              <img 
                key={i} 
                src={URL.createObjectURL(file)} 
                alt={`Pool ${i}`} 
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '2px solid var(--primary)', cursor: 'grab', flexShrink: 0 }} 
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontSize: '18px' }}>Script Timeline</h3>
        {mapping.map((seg, i) => (
          <div 
            key={i} 
            className="glass-panel" 
            style={{ borderLeft: '4px solid var(--primary)', padding: '15px' }}
            onDrop={(e) => handleDropOnSegment(e, i)}
            onDragOver={handleDragOver}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
              [{seg.start.toFixed(1)}s ~ {seg.end.toFixed(1)}s]
            </div>
            <textarea
              value={seg.text}
              onChange={(e) => updateSegmentText(i, e.target.value)}
              style={{ 
                width: '100%', 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                color: 'var(--text)', 
                border: '1px solid var(--border)', 
                borderRadius: '6px', 
                padding: '10px', 
                fontSize: '15px', 
                marginBottom: '15px', 
                fontFamily: 'inherit', 
                resize: 'vertical', 
                minHeight: '60px' 
              }}
            />
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {seg.images.map((img, imgIdx) => (
                <div key={imgIdx} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(img)} alt={`Seg ${i} Img ${imgIdx}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                  <button 
                    onClick={() => removeImage(i, imgIdx)}
                    style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--bg-panel)', borderRadius: '50%', padding: '2px', cursor: 'pointer', border: '1px solid var(--border)' }}
                  >
                    <Trash2 size={12} color="#f87171" />
                  </button>
                </div>
              ))}
              
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', border: '1px dashed var(--border)', borderRadius: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                <input type="file" multiple accept="image/*" className="input-file" onChange={(e) => handleSegmentUpload(i, e)} />
                <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>+</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
