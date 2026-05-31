'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import UploadUI from './components/UploadUI';
import SubtitleUI from './components/SubtitleUI';
import ProgressUI from './components/ProgressUI';
import ScriptImageMapper, { MappedSegment } from './components/ScriptImageMapper';
import { generateSubtitles, WhisperSegment } from '@/lib/whisper';
import { renderVideo } from '@/lib/render';
import { MotionIntensity } from '@/lib/randomMotion';
import { TransitionType, transitions } from '@/lib/transitions';
import { Play, Download, Settings } from 'lucide-react';

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  
  const [audio, setAudio] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [cta, setCta] = useState<File | null>(null);
  
  const [segments, setSegments] = useState<WhisperSegment[]>([]);
  const [mappedSegments, setMappedSegments] = useState<MappedSegment[]>([]);
  const [ratio, setRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [intensity, setIntensity] = useState<MotionIntensity>(2);
  const [transition, setTransition] = useState<TransitionType>('fade');
  
  const [subColor, setSubColor] = useState('#FFFFFF');
  const [subSize, setSubSize] = useState(24);
  const [subPos, setSubPos] = useState<'top' | 'bottom' | 'center'>('bottom');
  
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      ffmpegRef.current = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setLoaded(true);
    };
    loadFFmpeg().catch(console.error);
  }, []);

  const handleAnalyze = async () => {
    if (!audio || !ffmpegRef.current) return;
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const ffmpeg = ffmpegRef.current;
      setMessage('Compressing audio for Whisper API (to avoid 4.5MB limit)...');
      await ffmpeg.writeFile('input_audio', await fetchFile(audio));
      await ffmpeg.exec(['-i', 'input_audio', '-ac', '1', '-ar', '16000', '-b:a', '16k', 'compressed.mp3']);
      const compressedData = await ffmpeg.readFile('compressed.mp3');
      const compressedBlob = new Blob([compressedData as any], { type: 'audio/mp3' });

      setMessage('Analyzing audio with Whisper...');
      const extractedSegments = await generateSubtitles(compressedBlob);
      setSegments(extractedSegments);
      setMessage('');
    } catch (err: any) {
      console.error(err);
      setMessage('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (mappedSegments.length === 0 || !audio || !ffmpegRef.current) return;
    setIsProcessing(true);
    setVideoUrl(null);
    setProgress(0);
    
    try {
      setMessage('Rendering video with FFmpeg...');
      
      const url = await renderVideo({
        ffmpeg: ffmpegRef.current,
        mappedSegments,
        thumbnail,
        cta,
        audio,
        ratio,
        intensity,
        transition,
        subColor,
        subSize,
        subPos,
        onProgress: (p) => setProgress(p)
      });
      
      setVideoUrl(url);
      setMessage('Done!');
    } catch (err: any) {
      console.error(err);
      setMessage('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>AI Video Maker</h1>
        <p className="subtitle">Upload images and voice to create a stunning subtitled video directly in your browser.</p>
      </div>

      {!loaded ? (
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <div className="animate-pulse">Loading FFmpeg Core...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <UploadUI 
              onAudioSelect={setAudio} 
              onThumbnailSelect={setThumbnail}
              onCtaSelect={setCta}
            />
            
            {!segments.length && (
              <button 
                className="btn-primary" 
                onClick={handleAnalyze} 
                disabled={isProcessing || !audio}
                style={{ padding: '16px', fontSize: '18px', backgroundColor: 'var(--primary)' }}
              >
                {isProcessing ? 'Analyzing...' : 'Analyze Audio Script'}
              </button>
            )}

            {segments.length > 0 && (
              <ScriptImageMapper 
                segments={segments} 
                onMappingChange={setMappedSegments} 
              />
            )}
            
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} style={{ color: 'var(--primary)' }} /> Video Settings
              </h3>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--text-muted)' }}>Aspect Ratio</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['9:16', '16:9', '1:1'].map((r) => (
                    <button 
                      key={r}
                      className={`btn-secondary ${ratio === r ? 'active' : ''}`}
                      onClick={() => setRatio(r as any)}
                      style={{ flex: 1 }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--text-muted)' }}>Motion Intensity</label>
                  <select className="select-input" value={intensity} onChange={(e) => setIntensity(Number(e.target.value) as MotionIntensity)}>
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--text-muted)' }}>Transition</label>
                  <select className="select-input" value={transition} onChange={(e) => setTransition(e.target.value as TransitionType)}>
                    {transitions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <SubtitleUI 
              subColor={subColor} setSubColor={setSubColor}
              subSize={subSize} setSubSize={setSubSize}
              subPos={subPos} setSubPos={setSubPos}
            />
            
            <button 
              className="btn-primary" 
              onClick={handleGenerate} 
              disabled={isProcessing || mappedSegments.length === 0 || !audio}
              style={{ padding: '16px', fontSize: '18px' }}
            >
              <Play fill="currentColor" /> {isProcessing ? 'Processing...' : 'Generate Video'}
            </button>

            {isProcessing && <ProgressUI progress={progress} message={message} />}
            {!isProcessing && message.startsWith('Error') && (
              <div className="glass-panel" style={{ textAlign: 'center', color: '#f87171' }}>
                <h3 style={{ marginBottom: '15px' }}>Generation Failed</h3>
                <p>{message}</p>
              </div>
            )}

            {videoUrl && (
              <div className="glass-panel" style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '15px', color: '#4ade80' }}>Ready to Download!</h3>
                <video src={videoUrl} controls style={{ width: '100%', maxHeight: '400px', borderRadius: '8px', marginBottom: '15px' }} />
                <a href={videoUrl} download="ai_video.mp4" className="btn-primary" style={{ width: '100%' }}>
                  <Download /> Download MP4
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
