import { pointer, bisector, select } from "d3";
import type { ChartDataRow, ChartContext } from "@/types";

/**
 * Renders the cursor on the chart.
 */
export const renderCursor = (ctx: ChartContext, closestRow: ChartDataRow): void => {
  if (ctx.isStatic) return;

  const seriesGroup = ctx.selection
    .selectAll(".series")
    .data([null])
    .join("g")
    .attr("class", "series")
    .attr("transform", `translate(${ctx.margin.left}, ${ctx.margin.top})`)
    .attr("clip-path", "url(#clip)");

  seriesGroup
    .selectAll(".series-group")
    .data(
      ctx.series.map(({ label, color, accessor }) => ({
        label,
        color: color || ctx.colorScale(label),
        x: ctx.xSerie(closestRow),
        y: accessor(closestRow),
      }))
    )
    .join("g")
    .attr("class", "series-group")
    .attr("data-label", ({ label }) => label)
    .selectAll(".cursor.point")
    .data(({ x, y, color, label }) => [{ x, y, color, label }])
    .join("circle")
    .attr("class", "cursor point")
    .attr("data-label", ({ label }) => label)
    .attr("cx", ({ x }) => ctx.xScale(x) - ctx.margin.left)
    .attr("cy", ({ y }) => ctx.yScale(y) - ctx.margin.top)
    .attr("r", 4)
    .style("stroke", ({ color }) => color)
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr(
      "aria-label",
      ({ label, x, y }) => `Data point for ${label}, x: ${x}, y: ${y}`
    );

  seriesGroup
    .selectAll(".cursor.vertical-line")
    .data([closestRow])
    .join("line")
    .attr("class", "cursor vertical-line")
    .attr("x1", ctx.xScale(ctx.xSerie(closestRow)) - ctx.margin.left)
    .attr("y1", 0)
    .attr("x2", ctx.xScale(ctx.xSerie(closestRow)) - ctx.margin.left)
    .attr("y2", ctx.innerHeight);
};

/**
 * Sets up cursor interaction event listeners.
 */
export const setupCursorEvents = (ctx: ChartContext): void => {
  if (ctx.isStatic) return;

  // Remove previous event listeners before adding new ones
  ctx.selection
    .on("pointermove", null)
    .on("pointerover", null)
    .on("pointerout", null);

  let lastCursorIdx: number | null = null;
  let lastTooltipDatum: any = null;
  let hideTooltipTimeout: any = null;
  const TOOLTIP_HIDE_DELAY = 40; // ms

  /**
   * Handle cursor movement and closest point detection.
   */
  const handlePointerMoveCursor = (event: PointerEvent) => {
    const [mouseX, mouseY] = pointer(event);
    const [xMinRange, xMaxRange] = ctx.xScale.range();
    const [yMaxRange, yMinRange] = ctx.yScale.range();

    // Check if mouse is within the chart area
    const isWithinXAxis = mouseX >= xMinRange && mouseX <= xMaxRange;
    const isWithinYAxis = mouseY >= yMinRange && mouseY <= yMaxRange;

    if (!(isWithinXAxis && isWithinYAxis)) {
      ctx.selection.selectAll(".cursor").classed("hidden", true);
      lastCursorIdx = null;
      return;
    }

    if (!ctx.data.length) return;

    // Use d3.bisector for O(log n) lookup
    const xValues = ctx.data.map(ctx.xSerie);
    const mouseDate = ctx.xScale.invert(mouseX);
    const bisect = bisector((d: number) => d).center;
    const idx = bisect(xValues as number[], mouseDate);

    // Clamp index to valid range
    const clampedIdx = Math.max(0, Math.min(idx, ctx.data.length - 1));

    if (lastCursorIdx === clampedIdx) return; // Only update if changed

    lastCursorIdx = clampedIdx;
    const closestDatum = ctx.data.at(clampedIdx);

    if (closestDatum) {
      renderCursor(ctx, closestDatum);
    }
  };

  /**
   * Handle tooltip display on hover.
   */
  const handleClosestPointOver = ({ target }: PointerEvent) => {
    if (target instanceof SVGElement && target.classList.contains("point")) {
      const datum = select(target).datum();

      if (hideTooltipTimeout) {
        clearTimeout(hideTooltipTimeout);
        hideTooltipTimeout = null;
      }

      // Only show if not already showing for this datum
      if (lastTooltipDatum !== datum) {
        ctx.tooltip.show(datum as ChartDataRow, target);
        lastTooltipDatum = datum;
      }
    }
  };

  /**
   * Handle tooltip hiding on mouse out.
   */
  const handleClosestPointOut = ({ target }: PointerEvent) => {
    if (target instanceof SVGElement && target.classList.contains("point")) {
      // Debounce hide to prevent flicker on rapid pointer transitions
      if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);

      hideTooltipTimeout = setTimeout(() => {
        ctx.tooltip.hide();
        lastTooltipDatum = null;
      }, TOOLTIP_HIDE_DELAY);
    }
  };

  // Throttle pointermove handler for performance
  let lastMove = 0;
  const throttleMs = 16; // ~60fps

  const throttledPointerMove = (event: PointerEvent) => {
    const now = Date.now();
    if (now - lastMove > throttleMs) {
      handlePointerMoveCursor(event);
      lastMove = now;
    }
  };

  ctx.selection
    .on("pointermove", throttledPointerMove)
    .on("pointerover", handleClosestPointOver)
    .on("pointerout", handleClosestPointOut);
};
