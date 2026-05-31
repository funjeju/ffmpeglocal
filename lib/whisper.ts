export interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export interface WhisperResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
}

export async function generateSubtitles(audioBlob: Blob): Promise<WhisperSegment[]> {
  const formData = new FormData();
  formData.append('file', audioBlob);

  const response = await fetch('/api/whisper', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to generate subtitles');
  }

  const data: WhisperResponse = await response.json();
  return data.segments;
}
