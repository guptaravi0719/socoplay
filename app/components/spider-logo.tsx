export function SpiderLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M27 30 C17 26 13 19 6 16" />
        <path d="M27 35 C15 35 11 29 3 29" />
        <path d="M27 39 C15 41 11 47 3 49" />
        <path d="M27 43 C17 49 13 55 7 59" />
        <path d="M37 30 C47 26 51 19 58 16" />
        <path d="M37 35 C49 35 53 29 61 29" />
        <path d="M37 39 C49 41 53 47 61 49" />
        <path d="M37 43 C47 49 51 55 57 59" />
      </g>
      <ellipse cx="32" cy="40" rx="8.5" ry="10.5" fill="currentColor" />
      <circle cx="32" cy="27" r="7" fill="currentColor" />
      <path d="M32 35 L28.5 40 L35.5 40 Z M32 45 L28.5 40 L35.5 40 Z" fill="#0b1f24" opacity=".55" />
      <circle cx="29" cy="25" r="1.4" fill="#0b1f24" />
      <circle cx="35" cy="25" r="1.4" fill="#0b1f24" />
    </svg>
  );
}

export function SpiderWeb({ className }: { className?: string }) {
  const point = (radius: number, index: number) => {
    const angle = (Math.PI * 2 * index) / 8;
    return {
      x: Number((100 + Math.cos(angle) * radius).toFixed(2)),
      y: Number((100 + Math.sin(angle) * radius).toFixed(2)),
    };
  };
  const spokes = Array.from({ length: 8 }, (_, index) => {
    const end = point(92, index);
    return <line key={index} x1="100" y1="100" x2={end.x} y2={end.y} />;
  });
  const rings = [26, 48, 70, 92].map((radius, index) => (
    <polygon
      key={index}
      points={Array.from({ length: 8 }, (_, spoke) => {
        const end = point(radius, spoke);
        return `${end.x},${end.y}`;
      }).join(" ")}
    />
  ));
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
    >
      {spokes}
      {rings}
    </svg>
  );
}
