import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { MotionIntensity, getZoomPanFilter } from './randomMotion';
import { TransitionType } from './transitions';

export interface RenderOptions {
  ffmpeg: FFmpeg;
  images: File[];
  audio: File;
  subtitleSrt: string;
  ratio: '9:16' | '16:9' | '1:1';
  intensity: MotionIntensity;
  transition: TransitionType;
  subColor: string;
  subSize: number;
  subPos: 'top' | 'bottom' | 'center';
  onProgress: (p: number) => void;
}

function hexToAssColor(hex: string) {
  // Convert #RRGGBB to &H00BBGGRR
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '&H00FFFFFF';
  const r = clean.substring(0, 2);
  const g = clean.substring(2, 4);
  const b = clean.substring(4, 6);
  return `&H00${b}${g}${r}`;
}

export async function renderVideo(opts: RenderOptions): Promise<string> {
  const { ffmpeg, images, audio, subtitleSrt, ratio, intensity, transition, subColor, subSize, subPos, onProgress } = opts;
  
  // 1. Write files to FFmpeg memory
  for (let i = 0; i < images.length; i++) {
    await ffmpeg.writeFile(`img${i}.jpg`, await fetchFile(images[i]));
  }
  await ffmpeg.writeFile('audio.mp3', await fetchFile(audio));
  await ffmpeg.writeFile('subs.srt', subtitleSrt);
  
  // Set output resolution based on ratio
  let width = 1080;
  let height = 1920;
  if (ratio === '16:9') {
    width = 1920;
    height = 1080;
  } else if (ratio === '1:1') {
    width = 1080;
    height = 1080;
  }

  // Calculate duration per image
  const imgDuration = 3;
  const xfadeDuration = 1;
  const totalImgDuration = imgDuration + xfadeDuration;
  
  let filterGraph = "";
  
  // Format and apply zoompan
  for (let i = 0; i < images.length; i++) {
    const zp = getZoomPanFilter(intensity, totalImgDuration, width, height);
    filterGraph += `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},${zp},setsar=1[v${i}];`;
  }

  // Xfade transition
  if (images.length === 1) {
    filterGraph += `[v0]copy[vout];`;
  } else {
    filterGraph += `[v0][v1]xfade=transition=${transition}:duration=${xfadeDuration}:offset=${imgDuration}[xf1];`;
    for (let i = 2; i < images.length; i++) {
      const currentOffset = imgDuration + ((imgDuration) * (i - 1));
      filterGraph += `[xf${i-1}][v${i}]xfade=transition=${transition}:duration=${xfadeDuration}:offset=${currentOffset}[xf${i}];`;
    }
    filterGraph += `[xf${images.length - 1}]copy[vout];`;
  }

  // Subtitle styling
  let alignment = 2; // bottom
  if (subPos === 'top') alignment = 8;
  if (subPos === 'center') alignment = 5;

  const assColor = hexToAssColor(subColor);
  const subStyle = `Alignment=${alignment},FontSize=${subSize},PrimaryColour=${assColor}`;
  
  filterGraph += `[vout]subtitles=subs.srt:force_style='${subStyle}'[finalv]`;

  // Build command arguments
  const inputArgs = [];
  for (let i = 0; i < images.length; i++) {
    inputArgs.push('-loop', '1', '-t', `${totalImgDuration}`, '-i', `img${i}.jpg`);
  }
  inputArgs.push('-i', 'audio.mp3');

  const args = [
    ...inputArgs,
    '-filter_complex', filterGraph,
    '-map', '[finalv]',
    '-map', `${images.length}:a`,
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
  const url = URL.createObjectURL(new Blob([data as Uint8Array], { type: 'video/mp4' }));
  return url;
}
