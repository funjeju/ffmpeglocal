export type MotionIntensity = 1 | 2 | 3;

export function getZoomPanFilter(intensity: MotionIntensity, duration: number, outputWidth: number, outputHeight: number) {
  const maxZoom = 1 + (intensity * 0.1);
  const fps = 30; // standard fps
  const frames = duration * fps;
  
  // zoompan outputs must match the output video resolution to prevent jumping or cropping issues later
  const s = `${outputWidth}x${outputHeight}`;
  
  const effects = [
    // Zoom in
    `zoompan=z='min(zoom+0.0015,${maxZoom})':d=${frames}:s=${s}`,
    // Zoom out
    `zoompan=z='if(eq(on,1),${maxZoom},zoom-0.0015)':d=${frames}:s=${s}`,
    // Pan right
    `zoompan=z=${maxZoom}:x='if(lte(on,1),0,x+1)':d=${frames}:s=${s}`,
    // Pan left
    `zoompan=z=${maxZoom}:x='if(lte(on,1),iw/zoom,x-1)':d=${frames}:s=${s}`
  ];
  
  return effects[Math.floor(Math.random() * effects.length)];
}
