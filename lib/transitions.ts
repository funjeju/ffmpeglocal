export const transitions = [
  "fade",
  "wipeleft",
  "wiperight",
  "wipeup",
  "wipedown",
  "slideleft",
  "slideright",
  "slideup",
  "slidedown",
  "circlecrop",
  "rectcrop",
  "distance",
  "fadeblack",
  "fadewhite",
  "radial",
  "smoothleft",
  "smoothright",
  "smoothup",
  "smoothdown",
  "pixelize"
] as const;

export type TransitionType = typeof transitions[number];

export function getRandomTransition(): TransitionType {
  return transitions[Math.floor(Math.random() * transitions.length)];
}
