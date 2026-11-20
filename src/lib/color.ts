const CategoricalPalette = [
  '#22d3ee',
  '#8b7cf6',
  '#60a5fa',
  '#34d399',
  '#f0abfc',
  '#fbbf24',
  '#f472b6',
  '#38bdf8',
  '#a78bfa',
  '#4ade80',
];

export function categoryColor(index: number): string {
  return CategoricalPalette[Math.abs(index) % CategoricalPalette.length];
}

export function categoryColorFor(value: string, categories: string[]): string {
  return categoryColor(categories.indexOf(value));
}

export function heatColor(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  const r = Math.round(12 + x * 34);
  const g = Math.round(18 + x * (211 - 18));
  const b = Math.round(28 + x * (238 - 28));
  return `rgb(${r}, ${g}, ${b})`;
}

export function mixColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const x = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(r1 + (r2 - r1) * x)}, ${Math.round(g1 + (g2 - g1) * x)}, ${Math.round(b1 + (b2 - b1) * x)})`;
}

export function intensityColor(t: number): string {
  return mixColor('#4c3fa8', '#67e8f9', t);
}
