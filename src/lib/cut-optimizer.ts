/**
 * Stone cut optimizer — all levels.
 *
 *  - "shelf"    : First-Fit-Decreasing-Height guillotine (fast, bridge saw).
 *  - "maxrects" : Maximal-Rectangles Best-Short-Side-Fit (higher yield) with
 *                 defect zones, remnant stock, and remnant reporting.
 *  - "freeform" : raster/grid nester for rectilinear (L-shaped) parts + defects
 *                 (approximates CNC waterjet free nesting).
 *
 * All engines return the same unified shape (bins[] of slabs/remnants).
 */

export type Engine = "shelf" | "maxrects" | "freeform";

export interface PartInput {
  label: string;
  w: number;
  h: number;
  qty: number;
  /** Lock grain direction → never rotate this part. */
  noRotate?: boolean;
  /** Optional corner notch → makes an L-shape (free-form engine only). */
  notchW?: number;
  notchH?: number;
  notchCorner?: "tl" | "tr" | "bl" | "br";
}

export interface Rect { x: number; y: number; w: number; h: number; }

export interface Placement {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
  /** sub-rectangles (relative to x,y) for drawing irregular shapes */
  parts?: Rect[];
}

export interface BinLayout {
  kind: "slab" | "remnant";
  w: number;
  h: number;
  placements: Placement[];
  freeRects: Rect[]; // leftover usable rectangles (remnants)
  usedArea: number;
  remnantId?: string; // source remnant id (for lifecycle tracking)
}

export interface OptimizeOptions {
  slabW: number;
  slabH: number;
  kerf: number;
  parts: PartInput[];
  allowRotate: boolean;
  defects?: Rect[];
  remnants?: { w: number; h: number; label?: string; id?: string }[];
  slabCost?: number;
  engine?: Engine;
}

export interface OptimizeResult {
  engine: Engine;
  slabW: number;
  slabH: number;
  kerf: number;
  bins: BinLayout[];
  slabsUsed: number;
  remnantsUsed: number;
  partArea: number;
  totalArea: number;
  wasteArea: number;
  yieldPct: number;
  placedCount: number;
  cost: number | null;
  unplaced: { label: string; w: number; h: number }[];
}

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
function expand(parts: PartInput[]): PartInput[] {
  const out: PartInput[] = [];
  for (const p of parts) {
    const q = Math.max(0, Math.floor(p.qty || 0));
    for (let i = 0; i < q; i++) out.push({ ...p, label: p.label || "Part" });
  }
  return out;
}

/** MaxRects-style: remove `used` region from a free list, return new maxrects. */
function carve(free: Rect[], used: Rect): Rect[] {
  const out: Rect[] = [];
  for (const f of free) {
    const noOverlap =
      used.x >= f.x + f.w || used.x + used.w <= f.x ||
      used.y >= f.y + f.h || used.y + used.h <= f.y;
    if (noOverlap) { out.push(f); continue; }
    if (used.x > f.x) out.push({ x: f.x, y: f.y, w: used.x - f.x, h: f.h });
    if (used.x + used.w < f.x + f.w) out.push({ x: used.x + used.w, y: f.y, w: f.x + f.w - (used.x + used.w), h: f.h });
    if (used.y > f.y) out.push({ x: f.x, y: f.y, w: f.w, h: used.y - f.y });
    if (used.y + used.h < f.y + f.h) out.push({ x: f.x, y: used.y + used.h, w: f.w, h: f.y + f.h - (used.y + used.h) });
  }
  return prune(out);
}

function prune(rects: Rect[]): Rect[] {
  const keep: boolean[] = rects.map(() => true);
  for (let i = 0; i < rects.length; i++) {
    if (!keep[i]) continue;
    for (let j = 0; j < rects.length; j++) {
      if (i === j || !keep[j]) continue;
      if (contains(rects[j], rects[i])) { keep[i] = false; break; }
    }
  }
  return rects.filter((_, i) => keep[i] && rects[i].w > 0.01 && rects[i].h > 0.01);
}
function contains(a: Rect, b: Rect): boolean {
  return a.x <= b.x + 1e-6 && a.y <= b.y + 1e-6 &&
    a.x + a.w >= b.x + b.w - 1e-6 && a.y + a.h >= b.y + b.h - 1e-6;
}

interface Bin {
  kind: "slab" | "remnant";
  w: number; h: number;
  free: Rect[];
  placements: Placement[];
  remnantId?: string;
}

function finalize(
  engine: Engine,
  opts: OptimizeOptions,
  bins: Bin[],
  unplaced: { label: string; w: number; h: number }[]
): OptimizeResult {
  const { slabW, slabH, kerf, slabCost } = opts;
  const layouts: BinLayout[] = bins.map((b) => ({
    kind: b.kind, w: b.w, h: b.h,
    placements: b.placements,
    freeRects: b.free.filter((r) => r.w > 2 && r.h > 2),
    usedArea: b.placements.reduce((s, p) => s + p.w * p.h, 0),
    remnantId: b.remnantId,
  }));
  const slabsUsed = layouts.filter((b) => b.kind === "slab").length;
  const remnantsUsed = layouts.filter((b) => b.kind === "remnant" && b.placements.length > 0).length;
  const partArea = layouts.reduce((s, b) => s + b.usedArea, 0);
  const totalArea = layouts.reduce((s, b) => s + b.w * b.h, 0);
  const wasteArea = Math.max(0, totalArea - partArea);
  const yieldPct = totalArea > 0 ? (partArea / totalArea) * 100 : 0;
  const placedCount = layouts.reduce((s, b) => s + b.placements.length, 0);
  const cost = slabCost != null ? slabsUsed * slabCost : null;
  return {
    engine, slabW, slabH, kerf,
    bins: layouts.filter((b) => b.placements.length > 0 || b.kind === "slab"),
    slabsUsed, remnantsUsed, partArea, totalArea, wasteArea, yieldPct, placedCount, cost, unplaced,
  };
}

// ---------------------------------------------------------------------------
// MaxRects (levels 1-4)
// ---------------------------------------------------------------------------
const SORTERS: ((a: PartInput, b: PartInput) => number)[] = [
  (a, b) => b.w * b.h - a.w * a.h, // area desc
  (a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h), // longest side desc
  (a, b) => b.h - a.h, // height desc
  (a, b) => b.w - a.w, // width desc
];

/** Multi-start: run MaxRects with several orderings, keep the best (fewest slabs). */
function maxRects(opts: OptimizeOptions): OptimizeResult {
  let best: OptimizeResult | null = null;
  for (const sorter of SORTERS) {
    const r = maxRectsCore(opts, sorter);
    if (
      !best ||
      r.unplaced.length < best.unplaced.length ||
      (r.unplaced.length === best.unplaced.length && r.slabsUsed < best.slabsUsed) ||
      (r.unplaced.length === best.unplaced.length && r.slabsUsed === best.slabsUsed && r.yieldPct > best.yieldPct)
    ) {
      best = r;
    }
  }
  return best!;
}

function maxRectsCore(opts: OptimizeOptions, sorter: (a: PartInput, b: PartInput) => number): OptimizeResult {
  const { slabW, slabH, kerf, allowRotate, defects = [], remnants = [] } = opts;
  const rects = expand(opts.parts).sort(sorter);
  const unplaced: { label: string; w: number; h: number }[] = [];

  const bins: Bin[] = remnants.map((r) => ({
    kind: "remnant" as const, w: r.w, h: r.h, free: [{ x: 0, y: 0, w: r.w, h: r.h }], placements: [], remnantId: r.id,
  }));

  function newSlab(): Bin {
    let free: Rect[] = [{ x: 0, y: 0, w: slabW, h: slabH }];
    for (const d of defects) free = carve(free, d);
    const b: Bin = { kind: "slab", w: slabW, h: slabH, free, placements: [] };
    bins.push(b);
    return b;
  }

  function placeIn(bin: Bin, r: PartInput): boolean {
    const canRotate = allowRotate && !r.noRotate;
    const fw = r.w + kerf, fh = r.h + kerf;
    let best: { fr: Rect; w: number; h: number; rot: boolean; score: number } | null = null;
    for (const fr of bin.free) {
      const tries = canRotate
        ? [{ w: fw, h: fh, rot: false }, { w: fh, h: fw, rot: true }]
        : [{ w: fw, h: fh, rot: false }];
      for (const t of tries) {
        if (t.w <= fr.w + 1e-6 && t.h <= fr.h + 1e-6) {
          const score = Math.min(fr.w - t.w, fr.h - t.h);
          if (!best || score < best.score) best = { fr, w: t.w, h: t.h, rot: t.rot, score };
        }
      }
    }
    if (!best) return false;
    const used: Rect = { x: best.fr.x, y: best.fr.y, w: best.w, h: best.h };
    bin.placements.push({
      label: r.label, x: used.x, y: used.y,
      w: best.rot ? r.h : r.w, h: best.rot ? r.w : r.h, rotated: best.rot,
    });
    bin.free = carve(bin.free, used);
    return true;
  }

  for (const r of rects) {
    const canRotate = allowRotate && !r.noRotate;
    const fits = (w: number, h: number) =>
      (w + kerf <= slabW && h + kerf <= slabH) || (canRotate && h + kerf <= slabW && w + kerf <= slabH);
    if (!fits(r.w, r.h)) { unplaced.push({ label: r.label, w: r.w, h: r.h }); continue; }
    // remnant bins first, then slabs, then a new slab
    let placed = false;
    for (const b of bins.filter((x) => x.kind === "remnant")) if (placeIn(b, r)) { placed = true; break; }
    if (!placed) for (const b of bins.filter((x) => x.kind === "slab")) if (placeIn(b, r)) { placed = true; break; }
    if (!placed) { if (!placeIn(newSlab(), r)) unplaced.push({ label: r.label, w: r.w, h: r.h }); }
  }

  return finalize("maxrects", opts, bins, unplaced);
}

// ---------------------------------------------------------------------------
// Shelf / FFDH (fast guillotine)
// ---------------------------------------------------------------------------
function shelf(opts: OptimizeOptions): OptimizeResult {
  const { slabW, slabH, kerf, allowRotate } = opts;
  const rects = expand(opts.parts).sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h));
  const unplaced: { label: string; w: number; h: number }[] = [];
  interface S { y: number; height: number; usedW: number; }
  interface SB extends Bin { shelves: S[]; topY: number; }
  const bins: SB[] = [];

  function place(bin: SB, r: PartInput): boolean {
    const orients = allowRotate && !r.noRotate ? [{ w: r.w, h: r.h, rot: false }, { w: r.h, h: r.w, rot: true }] : [{ w: r.w, h: r.h, rot: false }];
    for (const sh of bin.shelves) for (const o of orients) {
      if (o.h > sh.height) continue;
      const gap = sh.usedW > 0 ? kerf : 0;
      if (sh.usedW + gap + o.w <= slabW) {
        const x = sh.usedW + gap;
        bin.placements.push({ label: r.label, x, y: sh.y, w: o.w, h: o.h, rotated: o.rot });
        sh.usedW = x + o.w; return true;
      }
    }
    for (const o of [...orients].sort((a, b) => a.h - b.h)) {
      const gap = bin.shelves.length > 0 ? kerf : 0; const y = bin.topY + gap;
      if (y + o.h <= slabH && o.w <= slabW) {
        bin.shelves.push({ y, height: o.h, usedW: o.w });
        bin.placements.push({ label: r.label, x: 0, y, w: o.w, h: o.h, rotated: o.rot });
        bin.topY = y + o.h; return true;
      }
    }
    return false;
  }
  for (const r of rects) {
    const fits = (w: number, h: number) => (w <= slabW && h <= slabH) || (allowRotate && h <= slabW && w <= slabH);
    if (!fits(r.w, r.h)) { unplaced.push({ label: r.label, w: r.w, h: r.h }); continue; }
    let placed = false;
    for (const b of bins) if (place(b, r)) { placed = true; break; }
    if (!placed) {
      const b: SB = { kind: "slab", w: slabW, h: slabH, free: [], placements: [], shelves: [], topY: 0 };
      bins.push(b); if (!place(b, r)) unplaced.push({ label: r.label, w: r.w, h: r.h });
    }
  }
  // approximate free space for remnant reporting
  for (const b of bins) {
    let free: Rect[] = [{ x: 0, y: 0, w: slabW, h: slabH }];
    for (const p of b.placements) free = carve(free, { x: p.x, y: p.y, w: p.w, h: p.h });
    b.free = free;
  }
  return finalize("shelf", opts, bins, unplaced);
}

// ---------------------------------------------------------------------------
// Free-form raster nester (level 5) — rectilinear parts (rects + L-notch)
// ---------------------------------------------------------------------------
function partMask(p: PartInput, cell: number): boolean[][] {
  const cols = Math.max(1, Math.round(p.w / cell));
  const rows = Math.max(1, Math.round(p.h / cell));
  const m: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(true));
  if (p.notchW && p.notchH) {
    const nc = Math.min(cols, Math.round(p.notchW / cell));
    const nr = Math.min(rows, Math.round(p.notchH / cell));
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
      const rr = p.notchCorner === "bl" || p.notchCorner === "br" ? rows - 1 - r : r;
      const cc = p.notchCorner === "tr" || p.notchCorner === "br" ? cols - 1 - c : c;
      m[rr][cc] = false;
    }
  }
  return m;
}
function rotateMask(m: boolean[][]): boolean[][] {
  const rows = m.length, cols = m[0].length;
  const out: boolean[][] = Array.from({ length: cols }, () => Array(rows).fill(false));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = m[r][c];
  return out;
}
function maskToRects(m: boolean[][], cell: number): Rect[] {
  const out: Rect[] = [];
  for (let r = 0; r < m.length; r++) {
    let c = 0;
    while (c < m[r].length) {
      if (m[r][c]) { let c2 = c; while (c2 < m[r].length && m[r][c2]) c2++; out.push({ x: c * cell, y: r * cell, w: (c2 - c) * cell, h: cell }); c = c2; }
      else c++;
    }
  }
  return out;
}

function freeform(opts: OptimizeOptions): OptimizeResult {
  const { slabW, slabH, allowRotate, defects = [] } = opts;
  const cell = 2; // inches per grid cell
  const cols = Math.floor(slabW / cell), rows = Math.floor(slabH / cell);
  const unplaced: { label: string; w: number; h: number }[] = [];

  interface RB extends Bin { grid: boolean[][]; }
  const bins: RB[] = [];
  function newBin(): RB {
    const grid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
    for (const d of defects) {
      const c0 = Math.max(0, Math.floor(d.x / cell)), r0 = Math.max(0, Math.floor(d.y / cell));
      const c1 = Math.min(cols, Math.ceil((d.x + d.w) / cell)), r1 = Math.min(rows, Math.ceil((d.y + d.h) / cell));
      for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) grid[r][c] = true;
    }
    const b: RB = { kind: "slab", w: slabW, h: slabH, free: [], placements: [], grid };
    bins.push(b); return b;
  }
  function fitsAt(grid: boolean[][], mask: boolean[][], r0: number, c0: number): boolean {
    if (r0 + mask.length > rows || c0 + mask[0].length > cols) return false;
    for (let r = 0; r < mask.length; r++) for (let c = 0; c < mask[0].length; c++)
      if (mask[r][c] && grid[r0 + r][c0 + c]) return false;
    return true;
  }
  function place(bin: RB, p: PartInput): boolean {
    const base = partMask(p, cell);
    const orients = allowRotate && !p.noRotate ? [base, rotateMask(base)] : [base];
    for (let r0 = 0; r0 < rows; r0++) for (let c0 = 0; c0 < cols; c0++) {
      for (let oi = 0; oi < orients.length; oi++) {
        const m = orients[oi];
        if (fitsAt(bin.grid, m, r0, c0)) {
          for (let r = 0; r < m.length; r++) for (let c = 0; c < m[0].length; c++) if (m[r][c]) bin.grid[r0 + r][c0 + c] = true;
          const subs = maskToRects(m, cell);
          const w = m[0].length * cell, h = m.length * cell;
          bin.placements.push({ label: p.label, x: c0 * cell, y: r0 * cell, w, h, rotated: oi === 1, parts: subs });
          return true;
        }
      }
    }
    return false;
  }
  const list = expand(opts.parts).sort((a, b) => b.w * b.h - a.w * a.h);
  for (const p of list) {
    let placed = false;
    for (const b of bins) if (place(b, p)) { placed = true; break; }
    if (!placed) { if (!place(newBin(), p)) unplaced.push({ label: p.label, w: p.w, h: p.h }); }
  }
  if (bins.length === 0) newBin();
  return finalize("freeform", opts, bins, unplaced);
}

export function runOptimizer(opts: OptimizeOptions): OptimizeResult {
  switch (opts.engine) {
    case "shelf": return shelf(opts);
    case "freeform": return freeform(opts);
    default: return maxRects(opts);
  }
}
