import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { MotionIntensity, getZoomPanFilter } from './randomMotion';
import { TransitionType } from './transitions';
import { MappedSegment } from '@/app/components/ScriptImageMapper';

export interface RenderOptions {
  ffmpeg: FFmpeg;
  mappedSegments: MappedSegment[];
  audio: File;
  thumbnail?: File | null;
  cta?: File | null;
  ratio: '9:16' | '16:9' | '1:1';
  intensity: MotionIntensity;
  transition: TransitionType;
  subColor: string;
  subSize: number;
  subPos: 'top' | 'bottom' | 'center';
  onProgress: (p: number) => void;
}

function hexToAssColor(hex: string) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '&H00FFFFFF';
  const r = clean.substring(0, 2);
  const g = clean.substring(2, 4);
  const b = clean.substring(4, 6);
  return `&H00${b}${g}${r}`;
}

export async function renderVideo(opts: RenderOptions): Promise<string> {
  const { ffmpeg, mappedSegments, audio, thumbnail, cta, ratio, intensity, transition, subColor, subSize, subPos, onProgress } = opts;
  
  // Extract sequential images and calculate their exact required durations
  const timeline: { file: File, contribution: number }[] = [];
  
  // If thumbnail exists, we assign it a default duration (e.g. 3s)
  if (thumbnail) {
    timeline.push({ file: thumbnail, contribution: 3.0 });
  }

  // Iterate over segments
  for (const seg of mappedSegments) {
    if (seg.images.length === 0) continue;
    const segmentDuration = seg.end - seg.start;
    const durationPerImage = segmentDuration / seg.images.length;
    for (const img of seg.images) {
      timeline.push({ file: img, contribution: durationPerImage });
    }
  }

  // If CTA exists, assign default duration
  if (cta) {
    timeline.push({ file: cta, contribution: 3.0 });
  }

  if (timeline.length === 0) throw new Error("No images mapped!");

  // Generate SRT from segments
  let srtContent = '';
  // Since thumbnail adds 3 seconds to the beginning, all subtitle times need to be shifted by 3 seconds if thumbnail exists.
  const timeOffset = thumbnail ? 3.0 : 0.0;
  
  mappedSegments.forEach((seg, i) => {
    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };
    srtContent += `${i + 1}\n`;
    srtContent += `${formatTime(seg.start + timeOffset)} --> ${formatTime(seg.end + timeOffset)}\n`;
    srtContent += `${seg.text}\n\n`;
  });

  // Write files
  for (let i = 0; i < timeline.length; i++) {
    await ffmpeg.writeFile(`img${i}.jpg`, await fetchFile(timeline[i].file));
  }
  await ffmpeg.writeFile('audio.mp3', await fetchFile(audio));
  await ffmpeg.writeFile('subs.srt', srtContent);
  
  // Load Korean Font (Crucial for preventing squares/tofu in FFmpeg subtitles)
  try {
    await ffmpeg.writeFile('font.ttf', await fetchFile('/font.ttf'));
  } catch (e) {
    console.warn("Could not load Korean font, subtitles might be broken");
  }
  
  let width = 1080;
  let height = 1920;
  if (ratio === '16:9') { width = 1920; height = 1080; }
  else if (ratio === '1:1') { width = 1080; height = 1080; }

  const xfadeDuration = 1.0;
  let filterGraph = "";
  
  // Calculate FFmpeg input duration (contribution + fade overlap)
  for (let i = 0; i < timeline.length; i++) {
    const isLast = i === timeline.length - 1;
    // The input duration must be long enough to cover its own contribution AND the fade into the next image
    const inputDuration = isLast ? timeline[i].contribution : timeline[i].contribution + xfadeDuration;
    
    // Safety check: ensure inputDuration is at least slightly longer than xfadeDuration
    const safeInputDuration = Math.max(inputDuration, xfadeDuration + 0.1);
    
    const zp = getZoomPanFilter(intensity, safeInputDuration, width, height);
    filterGraph += `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},${zp},setsar=1[v${i}];`;
  }

  // Xfade transitions
  if (timeline.length === 1) {
    filterGraph += `[v0]copy[vout];`;
  } else {
    let currentOffset = timeline[0].contribution;
    filterGraph += `[v0][v1]xfade=transition=${transition}:duration=${xfadeDuration}:offset=${currentOffset}[xf1];`;
    
    for (let i = 2; i < timeline.length; i++) {
      currentOffset += timeline[i-1].contribution;
      filterGraph += `[xf${i-1}][v${i}]xfade=transition=${transition}:duration=${xfadeDuration}:offset=${currentOffset}[xf${i}];`;
    }
    filterGraph += `[xf${timeline.length - 1}]copy[vout];`;
  }

  // Subtitle styling
  let alignment = 2;
  if (subPos === 'top') alignment = 8;
  if (subPos === 'center') alignment = 5;

  const assColor = hexToAssColor(subColor);
  const subStyle = `Alignment=${alignment},FontSize=${subSize},PrimaryColour=${assColor},Fontname=NotoSansCJKkr-VF`;
  
  filterGraph += `[vout]subtitles=subs.srt:fontsdir=/:force_style='${subStyle}'[finalv]`;

  // Build FFmpeg command arguments
  const inputArgs = [];
  for (let i = 0; i < timeline.length; i++) {
    const isLast = i === timeline.length - 1;
    const inputDuration = isLast ? timeline[i].contribution : timeline[i].contribution + xfadeDuration;
    const safeInputDuration = Math.max(inputDuration, xfadeDuration + 0.1);
    inputArgs.push('-loop', '1', '-t', `${safeInputDuration}`, '-i', `img${i}.jpg`);
  }
  inputArgs.push('-i', 'audio.mp3');

  const args = [
    ...inputArgs,
    '-filter_complex', filterGraph,
    '-map', '[finalv]',
    '-map', `${timeline.length}:a`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-shortest',
    'output.mp4'
  ];

  ffmpeg.on('progress', ({ progress }) => {
    onProgress(Math.round(progress * 100));
  });

  await ffmpeg.exec(args);
  
  const data = await ffmpeg.readFile('output.mp4');
  const url = URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' }));
  return url;
}
