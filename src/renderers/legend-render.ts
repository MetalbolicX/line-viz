import type { ChartContext } from "../context/chart-context";

/**
 * Renders the legend on the chart.
 */
export const renderLegend = (ctx: ChartContext): void => {
  if (!ctx.series?.length) return;

  // Place legend at top center, horizontally
  const legendGroup = ctx.selection
    .selectAll(".legend")
    .data([null])
    .join("g")
    .attr("class", "legend")
    .attr(
      "transform",
      `translate(${ctx.innerWidth / 2 - ctx.margin.left}, ${ctx.margin.top / 2})`
    );

  // Horizontal layout: each item is offset by its width
  const itemWidth = 100; // px, adjust as needed

  legendGroup
    .selectAll(".legend-item")
    .data(ctx.series)
    .join("g")
    .attr("class", "legend-item")
    .attr("data-label", ({ label }) => label)
    .attr("transform", (_, i) => `translate(${i * itemWidth}, 0)`)
    .call((group) => {
      group
        .selectAll("rect")
        .data((d) => [d])
        .join("rect")
        .attr("class", "legend-square")
        .attr("x", 0)
        .attr("y", 0)
        .style("fill", ({ color, label }) => color || ctx.colorScale(label));

      group
        .selectAll("text")
        .data((d) => [d])
        .join("text")
        .attr("class", "legend-label")
        .attr("x", 20)
        .attr("y", 14)
        .text(({ label }) => label);
    });
};
