import { describe, expect, it } from "vitest";
import { runOptimizer } from "@/lib/cut-optimizer";

describe("cut optimizer", () => {
  it("places representative parts and reports bounded yield", () => {
    const result = runOptimizer({
      slabW: 126,
      slabH: 63,
      kerf: 0.125,
      allowRotate: true,
      engine: "maxrects",
      parts: [
        { label: "Island", w: 96, h: 36, qty: 1 },
        { label: "Counter", w: 98, h: 26, qty: 2 },
      ],
    });
    expect(result.slabsUsed).toBeGreaterThan(0);
    expect(result.placedCount).toBe(3);
    expect(result.unplaced).toEqual([]);
    expect(result.yieldPct).toBeGreaterThan(0);
    expect(result.yieldPct).toBeLessThanOrEqual(100);
  });

  it("rejects a part that cannot fit any slab", () => {
    const result = runOptimizer({ slabW: 40, slabH: 40, kerf: 0, allowRotate: true, engine: "shelf", parts: [{ label: "Too large", w: 80, h: 50, qty: 1 }] });
    expect(result.placedCount).toBe(0);
    expect(result.unplaced).toHaveLength(1);
  });
});

