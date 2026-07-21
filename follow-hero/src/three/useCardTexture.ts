import { useMemo } from "react";
import * as THREE from "three";
import type { CardData } from "./cardData";

const W = 640;
const H = 1000;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 2x2 grid of Google-color tiles, reads as a schedule/calendar glyph
function drawScheduleIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const tile = s * 0.46;
  const gap = s * 0.08;
  const colors = ["#4285F4", "#EA4335", "#F9AB00", "#34A853"];
  colors.forEach((color, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    ctx.fillStyle = color;
    roundRect(ctx, x + col * (tile + gap), y + row * (tile + gap), tile, tile, tile * 0.25);
    ctx.fill();
  });
}

export function drawCard(ctx: CanvasRenderingContext2D, data: CardData) {
  ctx.clearRect(0, 0, W, H);

  // card body
  ctx.fillStyle = "#111111";
  roundRect(ctx, 0, 0, W, H, 28);
  ctx.fill();

  const pad = 44;

  // name
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 54px 'Helvetica Neue', Arial, sans-serif";
  ctx.textBaseline = "top";
  const lines = data.name.split("\n");
  lines.forEach((line, i) => ctx.fillText(line, pad, pad + i * 60));

  // "See Talk" pill (top right), dot in the card's Google accent color
  if (data.cta === "support") {
    const pillW = 178,
      pillH = 56;
    const px = W - pad - pillW,
      py = pad + 4;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, px, py, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = data.accent;
    ctx.beginPath();
    ctx.arc(px + 30, py + pillH / 2, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.font = "600 26px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText("See Talk", px + 54, py + 15);
  }

  // role / location
  const roleY = pad + lines.length * 60 + 40;
  ctx.fillStyle = "#8f8f8f";
  ctx.font = "600 22px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(data.role.toUpperCase(), pad, roleY);
  ctx.fillStyle = "#ffffff";
  ctx.font = "400 26px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(data.location, pad, roleY + 32);

  // photo placeholder panel
  const photoY = roleY + 90;
  const photoH = H - photoY - 150;
  ctx.fillStyle = data.accent;
  roundRect(ctx, pad, photoY, W - pad * 2, photoH, 16);
  ctx.fill();
  // subtle gradient for depth
  const grad = ctx.createLinearGradient(0, photoY, 0, photoY + photoH);
  grad.addColorStop(0, "rgba(255,255,255,0.08)");
  grad.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = grad;
  roundRect(ctx, pad, photoY, W - pad * 2, photoH, 16);
  ctx.fill();

  // Add to My Schedule button
  const btnY = H - 120;
  const btnH = 76;
  ctx.fillStyle = "#000000";
  roundRect(ctx, pad, btnY, W - pad * 2, btnH, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  roundRect(ctx, pad, btnY, W - pad * 2, btnH, 16);
  ctx.stroke();
  drawScheduleIcon(ctx, pad + 24, btnY + 18, 40);
  ctx.fillStyle = "#ffffff";
  ctx.font = "400 18px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("Add to", pad + 90, btnY + 14);
  ctx.font = "700 26px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("My Schedule", pad + 90, btnY + 36);
}

export function useCardTexture(data: CardData) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    drawCard(ctx, data);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
}

export const CARD_ASPECT = W / H;

// Shared featureless back-of-card texture: same rounded-rect silhouette as
// the fronts (so corners stay rounded via alpha), no text — far-side cards
// should read as dark slabs, not mirrored ghosts.
let backTexture: THREE.CanvasTexture | null = null;
export function getCardBackTexture() {
  if (backTexture) return backTexture;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1c1c1c";
  roundRect(ctx, 0, 0, W, H, 28);
  ctx.fill();
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(255,255,255,0.05)");
  grad.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, W, H, 28);
  ctx.fill();
  backTexture = new THREE.CanvasTexture(canvas);
  backTexture.colorSpace = THREE.SRGBColorSpace;
  return backTexture;
}
