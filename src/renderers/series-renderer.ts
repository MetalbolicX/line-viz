import * as d3 from "d3";
import type { Selection, ScaleLinear } from "d3";
import { LineVizSeriesConfig } from "../types";

interface RenderSeriesParams {
  series: LineVizSeriesConfig[];
  data: any[];
  xSerie: (row: any) => number;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  margin: { top: number; left: number };
  isCurved: boolean;
  transitionTime: number;
  color: string;
  colorScale: (label: string) => string;
}

export const renderSeries = (
  selection: Selection<SVGSVGElement, unknown, null, undefined>,
  {
    series,
    data,
    xSerie,
    xScale,
    yScale,
    margin,
    isCurved,
    transitionTime,
    colorScale,
  }: RenderSeriesParams
) => {
  if (!(series?.length && data?.length)) return;

  const line = d3
    .line<{ x: number | Date; y: number }>()
    .x(({ x }) => xScale(x) - margin.left)
    .y(({ y }) => yScale(y) - margin.top);
  isCurved && line.curve(d3.curveCatmullRom);

  const seriesGroup = selection
    .selectAll(".series")
    .data([null])
    .join("g")
    .attr("class", "series")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .attr("clip-path", "url(#clip)");

  const group = seriesGroup
    .selectAll<SVGGElement, LineVizSeriesConfig>(".series-group")
    .data(series)
    .join("g")
    .attr("class", "series-group")
    .attr("data-label", ({ label }) => label);

  group
    .selectAll<SVGPathElement, LineVizSeriesConfig>("path.serie")
    .data(({ label, accessor, color }) => [
      {
        label,
        color: color || colorScale(label),
        coordinates: data.map((row) => ({
          x: xSerie(row),
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
          .attr("d", ({ coordinates }) => line(coordinates))
          .style("stroke", ({ color }) => color)
          .each(function () {
            const path = d3.select(this);
            const totalLength = (this as SVGPathElement).getTotalLength();
            path
              .attr("stroke-dasharray", totalLength)
              .attr("stroke-dashoffset", totalLength)
              .transition()
              .duration(transitionTime)
              .attr("stroke-dashoffset", 0);
          }),
      (update) =>
        update
          .each(function () {
            d3.select(this)
              .attr("stroke-dasharray", null)
              .attr("stroke-dashoffset", null);
          })
          .transition()
          .duration(transitionTime)
          .style("stroke", ({ color }) => color)
          .attr("d", ({ coordinates }) => line(coordinates)),
      (exit) => exit.remove()
    );
};
