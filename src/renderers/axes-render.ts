import * as d3 from "d3";
import type { ChartContext } from "../context/chart-context";

/**
 * Renders the X axis of the chart.
 */
export const renderXAxis = (ctx: ChartContext): void => {
  const xAxis = d3
    .axisBottom(ctx.xScale)
    .ticks(ctx.xTicks)
    .tickFormat(d3.format(ctx.formatXAxis) as any);

  ctx.selection
    .selectAll(".x.axis")
    .data([null])
    .join("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${ctx.innerHeight + ctx.margin.top})`)
    .call(xAxis as any);
};

/**
 * Renders the Y axis of the chart.
 */
export const renderYAxis = (ctx: ChartContext): void => {
  const yAxis = d3
    .axisLeft(ctx.yScale)
    .ticks(ctx.yTicks)
    .tickFormat(d3.format(ctx.formatYAxis));

  ctx.selection
    .selectAll(".y.axis")
    .data([null])
    .join("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${ctx.margin.left}, 0)`)
    .call(yAxis as any);
};

/**
 * Renders the X axis label on the chart.
 */
export const renderXAxisLabel = (ctx: ChartContext): void => {
  if (!ctx.xAxisLabel) return;

  ctx.selection
    .selectAll(".labels")
    .data([null])
    .join("g")
    .attr("class", "labels")
    .selectAll(".x.axis-label")
    .data([ctx.xAxisLabel])
    .join("text")
    .attr("class", "x axis-label")
    .attr("x", ctx.innerWidth / 2 + ctx.margin.left)
    .attr("y", ctx.innerHeight + ctx.margin.top)
    .attr("dy", "-0.5em")
    .text((d) => d);
};

/**
 * Renders the Y axis label on the chart.
 */
export const renderYAxisLabel = (ctx: ChartContext): void => {
  if (!ctx.yAxisLabel) return;

  ctx.selection
    .selectAll(".labels")
    .data([null])
    .join("g")
    .attr("class", "labels")
    .selectAll(".y.axis-label")
    .data([ctx.yAxisLabel])
    .join("text")
    .attr("class", "y axis-label")
    .attr("x", -ctx.margin.left)
    .attr("y", ctx.margin.top)
    .attr("transform", `rotate(-90, ${ctx.margin.left}, ${ctx.margin.top})`)
    .attr("dy", "1em")
    .text((d) => d);
};
