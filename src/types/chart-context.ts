import type { Selection, ScaleOrdinal, ScaleLinear } from "d3";
import type { ChartDataRow, LineVizSeriesConfig, MarginConfig } from "../types";
import type { TipVizTooltip } from "tipviz";

export interface ChartContext {
  // D3 selection and SVG dimensions
  selection: Selection<SVGElement, unknown, null, undefined>;
  innerWidth: number;
  innerHeight: number;

  // Data and series configuration
  data: ChartDataRow[];
  series: LineVizSeriesConfig[];
  xSerie: (d: ChartDataRow) => number;

  // Scales
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  colorScale: ScaleOrdinal<string, string>;

  // Layout and styling
  margin: MarginConfig;

  // Axis configuration
  xTicks: number;
  yTicks: number;
  formatXAxis: string;
  formatYAxis: string;
  xAxisLabel: string;
  yAxisLabel: string;

  // Behavior configuration
  isCurved: boolean;
  isStatic: boolean;
  transitionTime: number;

  // Interactive elements
  tooltip: TipVizTooltip;

  // Brush and zoom state (optional for some renderers)
  brush?: d3.BrushBehavior<unknown>;
  originalXDomain?: [number, number] | null;
  isZoomed?: boolean;
  idleTimeout?: any;
}
