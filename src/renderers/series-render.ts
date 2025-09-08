import { line, curveCatmullRom, select } from "d3";
import type { ChartContext } from "../types";

/**
 * Renders the series lines on the chart.
 */
export const renderSeries = (ctx: ChartContext): void => {
  if (!(ctx.series?.length && ctx.data?.length)) return;

  const lineGenerator = line<{ x: number; y: number }>()
    .x(({ x }) => ctx.xScale(x) - ctx.margin.left)
    .y(({ y }) => ctx.yScale(y) - ctx.margin.top);

  if (ctx.isCurved) {
    lineGenerator.curve(curveCatmullRom);
  }

  // Create a group for all series
  const seriesGroup = ctx.selection
    .selectAll(".series")
    .data([null])
    .join("g")
    .attr("class", "series")
    .attr("transform", `translate(${ctx.margin.left}, ${ctx.margin.top})`)
    .attr("clip-path", "url(#clip)");

  // For each series, create a group and a single path inside it
  const group = seriesGroup
    .selectAll<SVGGElement, any>(".series-group")
    .data(ctx.series)
    .join("g")
    .attr("class", "series-group")
    .attr("data-label", ({ label }) => label);

  group
    .selectAll<SVGPathElement, any>("path.serie")
    .data(({ label, accessor, color }) => [
      {
        label,
        color: color || ctx.colorScale(label),
        coordinates: ctx.data.map((row) => ({
          x: ctx.xSerie(row),
          y: accessor(row),
        })),
      },
    ])
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("class", "serie")
          .attr("data-label", ({ label }) => label)
          .attr("d", ({ coordinates }) => lineGenerator(coordinates))
          .style("stroke", ({ color }) => color)
          .each(function () {
            const path = select(this);
            const totalLength = (this as SVGPathElement).getTotalLength();
            path
              .attr("stroke-dasharray", totalLength)
              .attr("stroke-dashoffset", totalLength)
              .transition()
              .duration(ctx.transitionTime)
              .attr("stroke-dashoffset", 0);
          }),
      (update) =>
        update
          .each(function () {
            // clear stroke-dash settings that were added by the enter animation
            select(this)
              .attr("stroke-dasharray", null)
              .attr("stroke-dashoffset", null);
          })
          .transition()
          .duration(ctx.transitionTime)
          .style("stroke", ({ color }) => color)
          .attr("d", ({ coordinates }) => lineGenerator(coordinates)),
      (exit) => exit.remove()
    );
};
