import * as d3 from "d3";
import type { ChartContext } from "../context/ChartContext";

/**
 * Sets up the brush behavior for x-axis zooming.
 */
export const setupBrush = (ctx: ChartContext, onRedraw?: () => void): void => {
  if (ctx.isStatic) return;

  // Initialize brush state if not present
  if (!ctx.originalXDomain) {
    ctx.originalXDomain = ctx.xScale.domain() as [number, number];
  }
  if (ctx.isZoomed === undefined) {
    ctx.isZoomed = false;
  }

  // Create brush behavior - use inner chart dimensions only
  ctx.brush = d3
    .brushX()
    .extent([
      [0, 0],
      [ctx.innerWidth, ctx.innerHeight],
    ])
    .on("end", (event) => handleBrush(event, ctx, onRedraw));

  // Add clip path to prevent drawing outside chart area
  ctx.selection
    .selectAll("defs")
    .data([null])
    .join("defs")
    .selectAll("#clip")
    .data([null])
    .join("clipPath")
    .attr("id", "clip")
    .selectAll("rect")
    .data([null])
    .join("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", ctx.innerWidth)
    .attr("height", ctx.innerHeight);

  // Create the brush group with clip path
  const brushGroup = ctx.selection
    .selectAll(".brush-container")
    .data([null])
    .join("g")
    .attr("class", "brush-container")
    .attr("transform", `translate(${ctx.margin.left}, ${ctx.margin.top})`)
    .attr("clip-path", "url(#clip)");

  brushGroup
    .selectAll(".brush")
    .data([null])
    .join("g")
    .attr("class", "brush")
    .call(ctx.brush as any);
};

/**
 * Handles the brush event for x-axis zooming.
 */
const handleBrush = (event: d3.D3BrushEvent<unknown>, ctx: ChartContext, onRedraw?: () => void): void => {
  const extent = event.selection;

  if (!extent) {
    // If no selection, wait a bit then reset to original domain
    if (!ctx.idleTimeout) {
      ctx.idleTimeout = setTimeout(() => {
        ctx.idleTimeout = null;
      }, 350);
      return;
    }

    if (ctx.originalXDomain) {
      ctx.xScale.domain(ctx.originalXDomain);
      ctx.isZoomed = false;
    }
  } else {
    // Update x scale domain based on brush selection
    const [x0, x1] = extent as [number, number];
    const newDomain: [number, number] = [
      ctx.xScale.invert(x0),
      ctx.xScale.invert(x1),
    ];

    // Check if the selection is meaningful (not too small)
    const minSelectionWidth = 10; // pixels
    if (x1 - x0 < minSelectionWidth) {
      return;
    }

    ctx.xScale.domain(newDomain);
    ctx.isZoomed = true;

    // Clear the brush selection after zooming
    const brushContainer = ctx.selection.select(".brush-container");
    const brushGroup = brushContainer.select(".brush") as d3.Selection<
      SVGGElement,
      unknown,
      any,
      any
    >;
    brushGroup.call(ctx.brush!.move, null);
  }

  // Call the redraw callback if provided
  onRedraw?.();
};

/**
 * Resets the zoom to the original x-axis domain.
 */
export const resetZoom = (ctx: ChartContext, onRedraw?: () => void): void => {
  if (ctx.originalXDomain && ctx.isZoomed) {
    ctx.xScale.domain(ctx.originalXDomain);
    ctx.isZoomed = false;
    onRedraw?.();
  }
};
