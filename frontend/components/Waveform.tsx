// Decorative waveform. The heights come from the stem id, so each stem always
// looks the same. It is not real audio data.
export default function Waveform({ seed, height = 56 }: { seed: number; height?: number }) {
  const bars = 40;
  const heights = Array.from({ length: bars }, (_, i) => {
    const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const r = x - Math.floor(x);
    return 6 + r * 30;
  });
  return (
    <svg
      className="wave"
      viewBox="0 0 200 40"
      preserveAspectRatio="none"
      width="100%"
      height={height}
      role="img"
      aria-label="Waveform"
    >
      {heights.map((h, i) => (
        <line key={i} x1={2.5 + i * 5} x2={2.5 + i * 5} y1={20 - h / 2} y2={20 + h / 2} />
      ))}
    </svg>
  );
}
