// Géométrie partagée du terrain SVG pour l'éditeur de tactiques et la vue
// Opposition (attaque vs défense) — même repère (yards) et même échelle.

export const X_MIN = -25;
export const X_MAX = 25;
export const Y_MIN = -12;
export const Y_MAX = 30;
export const SCALE = 10;

export const WIDTH = (X_MAX - X_MIN) * SCALE;
export const HEIGHT = (Y_MAX - Y_MIN) * SCALE;

export function screenX(x: number) {
  return (x - X_MIN) * SCALE;
}

export function screenY(y: number) {
  return (Y_MAX - y) * SCALE;
}

export function yardLines(): number[] {
  const lines: number[] = [];
  for (let y = Math.ceil(Y_MIN / 5) * 5; y <= Y_MAX; y += 5) {
    lines.push(y);
  }
  return lines;
}
