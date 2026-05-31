export async function generateSubtitles(audioBlob: Blob): Promise<string> {
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

  return response.text(); // Returns SRT content
}
