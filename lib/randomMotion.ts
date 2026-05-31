export type MotionIntensity = 1 | 2 | 3;

export function getZoomPanFilter(intensity: MotionIntensity, duration: number, outputWidth: number, outputHeight: number) {
  // maxZoom determines how much we zoom in to allow panning
  // Low: 1.10, Medium: 1.25, High: 1.40
  const maxZoom = 1 + (intensity * 0.15) - 0.05; 
  const fps = 30; // standard fps
  const frames = Math.floor(duration * fps);
  const s = `${outputWidth}x${outputHeight}`;
  
  // Zoom step per frame
  const zStep = (maxZoom - 1) / frames;
  
  const effects = [
    // Zoom in (center)
    `zoompan=z='min(zoom+${zStep},${maxZoom})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${s}`,
    // Zoom out (center)
    `zoompan=z='if(eq(on,1),${maxZoom},zoom-${zStep})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${s}`,
    // Pan right (starts zoomed in)
    `zoompan=z=${maxZoom}:x='(iw-iw/zoom)*(on/${frames})':y='ih/2-(ih/zoom/2)':d=${frames}:s=${s}`,
    // Pan left (starts zoomed in)
    `zoompan=z=${maxZoom}:x='(iw-iw/zoom)*(1-(on/${frames}))':y='ih/2-(ih/zoom/2)':d=${frames}:s=${s}`,
    // Pan down
    `zoompan=z=${maxZoom}:x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*(on/${frames})':d=${frames}:s=${s}`,
    // Pan up
    `zoompan=z=${maxZoom}:x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*(1-(on/${frames}))':d=${frames}:s=${s}`
  ];
  
  return effects[Math.floor(Math.random() * effects.length)];
}
