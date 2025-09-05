import * as d3 from "d3";
import type { Selection, ScaleOrdinal } from "d3";
import type { LineVizSeriesConfig, ChartDataRow, MarginConfig } from "./types";
import type { TipVizTooltip } from "tipviz";
import type { ChartContext } from "./context/ChartContext";
import { ConfigurationManager, DataService, ChartDimensions } from "./services";
import {
  renderXAxis,
  renderYAxis,
  renderXAxisLabel,
  renderYAxisLabel,
  renderSeries,
  renderLegend,
  renderXGrid,
  renderYGrid,
} from "./renderers";
import { setupCursorEvents } from "./renderers/cursor-render";
import {
  setupBrush,
  resetZoom as resetZoomBrush,
} from "./renderers/brush-render";
import { validateSetup } from "./utils/ChartUtils";

/**
 * @module d3-line-viz
 * @description
 * This module provides a function to create a line visualization chart using D3.js.
 * It allows for multiple series, custom colors, and various configurations.
 */

/**
 * Creates a line visualization chart using D3.js.
 * The chart supports multiple series, custom colors, and various configurations.
 *
 * @returns {Function} A function that can be called with a D3 selection to render the chart.
 */
export const createLineVizChart = () => {
  // Get default configuration
  const defaultConfig = ConfigurationManager.getDefaultConfig();

  // Chart context - all state and configuration
  const ctx: Partial<ChartContext> = {
    // Configuration from defaults
    isCurved: defaultConfig.isCurved,
    isStatic: defaultConfig.isStatic,
    transitionTime: defaultConfig.transitionTime,
    xTicks: defaultConfig.xTicks,
    yTicks: defaultConfig.yTicks,
    margin: { ...defaultConfig.margin },
    formatXAxis: defaultConfig.formatXAxis,
    formatYAxis: defaultConfig.formatYAxis,
    xAxisLabel: defaultConfig.xAxisLabel,
    yAxisLabel: defaultConfig.yAxisLabel,

    // Brush and zoom state
    originalXDomain: null,
    isZoomed: false,
    idleTimeout: null,
  };

  /**
   * Redraws specific chart components after zoom/brush operations.
   */
  const redrawChart = (): void => {
    if (!ctx.selection) return;

    const fullCtx = ctx as ChartContext;
    renderXAxis(fullCtx);
    renderXGrid(fullCtx);
    renderSeries(fullCtx);
  };

  /**
   * The main chart function that renders the line visualization.
   */
  const chart = (
    selection: Selection<SVGElement, unknown, null, undefined>
  ) => {
    if (!validateSetup(ctx)) {
      console.warn("[d3-line-viz] Chart setup is invalid.");
      return;
    }

    // selection.attr("viewBox", `0 0 ${width} ${height}`);
    const dimensions = new ChartDimensions(
      selection.node() as SVGElement,
      ctx.margin!
    );
    if (!dimensions.areValidDimensions) {
      console.warn("[d3-line-viz] SVG element has invalid width or height.");
      return;
    }

    const { innerWidth, innerHeight } = dimensions;
    // Update context with calculated values
    ctx.selection = selection;
    ctx.innerWidth = innerWidth;
    ctx.innerHeight = innerHeight;

    // Calculate X scale domain
    const xDomain = DataService.getDataDomain(ctx.data!, [ctx.xSerie!]);
    if (!xDomain) {
      console.warn(
        "[d3-line-viz] xSerie must return numbers for all data points."
      );
      return;
    }

    ctx.xScale = d3
      .scaleLinear()
      .domain(xDomain)
      .range([ctx.margin!.left, innerWidth + ctx.margin!.left])
      .nice();

    // Store the original domain for reset functionality
    if (!ctx.originalXDomain) {
      ctx.originalXDomain = ctx.xScale.domain() as [number, number];
    }

    // Calculate Y scale domain
    const yDomain = DataService.getDataDomain(
      ctx.data!,
      ctx.series!.map(({ accessor }) => accessor)
    );
    if (!yDomain) {
      console.warn(
        "[d3-line-viz] Series accessors must return numbers for all data points."
      );
      return;
    }

    ctx.yScale = d3
      .scaleLinear()
      .domain(yDomain)
      .range([innerHeight + ctx.margin!.top, ctx.margin!.top])
      .nice();

    // Render all chart components
    const fullCtx = ctx as ChartContext;

    renderXAxis(fullCtx);
    renderYAxis(fullCtx);
    renderXGrid(fullCtx);
    renderYGrid(fullCtx);
    renderXAxisLabel(fullCtx);
    renderYAxisLabel(fullCtx);
    renderSeries(fullCtx);
    renderLegend(fullCtx);

    // Setup interactions
    setupBrush(fullCtx, redrawChart);
    setupCursorEvents(fullCtx);
  };

  /**
   * Sets the x-axis accessor function.
   * @param accessor - A function that extracts the x value from a data row.
   * @returns The chart instance for chaining.
   */
  chart.xSerie = (accessor: (d: ChartDataRow) => number) => {
    if (typeof accessor !== "function") {
      console.warn("xSerie accessor must be a function");
      return chart;
    }
    ctx.xSerie = accessor;
    return chart;
  };

  /**
   * Sets the series configuration.
   * @param fields - An array of series configurations.
   * @returns The chart instance for chaining.
   */
  chart.series = (fields: LineVizSeriesConfig[]) => {
    if (!Array.isArray(fields)) {
      console.warn("series must be an array");
      return chart;
    }
    ctx.series = fields;
    return chart;
  };

  /**
   * Sets the data for the chart.
   * @param dataset - An array of data rows.
   * @returns The chart instance for chaining.
   */
  chart.data = (dataset: ChartDataRow[]) => {
    if (!Array.isArray(dataset)) {
      console.warn("data must be an array");
      return chart;
    }
    ctx.data = dataset;
    return chart;
  };

  /**
   * Sets the color scale for the chart.
   * @param color - A D3 scaleOrdinal function for mapping data values to colors.
   * @returns The chart instance for chaining.
   */
  chart.colorScale = (color: ScaleOrdinal<string, string>) => {
    if (
      typeof color !== "function" ||
      typeof color.domain !== "function" ||
      typeof color.range !== "function"
    ) {
      console.warn("colorScale must be a valid D3 scaleOrdinal");
      return chart;
    }
    ctx.colorScale = color;
    return chart;
  };

  /**
   * Sets the curve interpolation for the line series.
   * @param bool - A boolean indicating whether the line should be curved.
   * @returns The chart instance for chaining.
   */
  chart.isCurved = (bool: boolean) => {
    if (typeof bool !== "boolean") {
      console.warn("isCurved must be a boolean");
      return chart;
    }
    ctx.isCurved = bool;
    return chart;
  };

  /**
   * Sets the static state of the chart.
   * @param bool - A boolean indicating whether the chart should be static.
   * @returns The chart instance for chaining.
   */
  chart.isStatic = (bool: boolean) => {
    if (typeof bool !== "boolean") {
      console.warn("isStatic must be a boolean");
      return chart;
    }
    ctx.isStatic = bool;
    return chart;
  };

  /**
   * Sets the transition time for the chart.
   * @param time - The transition time in milliseconds.
   * @returns The chart instance for chaining.
   */
  chart.transitionTime = (time: number) => {
    if (typeof time !== "number" || time < 0) {
      console.warn("transitionTime must be a non-negative number");
      return chart;
    }
    ctx.transitionTime = time;
    return chart;
  };

  /**
   * Sets the number of ticks on the x-axis.
   * @param quantity - The number of ticks.
   * @returns The chart instance for chaining.
   */
  chart.xTicks = (quantity: number) => {
    if (typeof quantity !== "number" || quantity < 0) {
      console.warn("xTicks must be a non-negative number");
      return chart;
    }
    ctx.xTicks = quantity;
    return chart;
  };

  /**
   * Sets the number of ticks on the y-axis.
   * @param quantity - The number of ticks.
   * @returns The chart instance for chaining.
   */
  chart.yTicks = (quantity: number) => {
    if (typeof quantity !== "number" || quantity < 0) {
      console.warn("yTicks must be a non-negative number");
      return chart;
    }
    ctx.yTicks = quantity;
    return chart;
  };

  /**
   * Sets the margin for the chart.
   * @param marg - An object specifying the margin values.
   * @returns The chart instance for chaining.
   */
  chart.margin = (marg: MarginConfig) => {
    if (typeof marg !== "object" || marg == null) {
      console.warn("margin must be an object");
      return chart;
    }
    ctx.margin = { ...ctx.margin!, ...marg };
    return chart;
  };

  /**
   * Sets the format for the x-axis ticks.
   * @param format - A string specifying the tick format.
   * @returns The chart instance for chaining.
   */
  chart.formatXAxis = (format: string) => {
    if (typeof format !== "string") {
      console.warn("formatXAxis must be a string");
      return chart;
    }
    ctx.formatXAxis = format;
    return chart;
  };

  /**
   * Sets the format for the y-axis ticks.
   * @param format - A string specifying the tick format.
   * @returns The chart instance for chaining.
   */
  chart.formatYAxis = (format: string) => {
    if (typeof format !== "string") {
      console.warn("formatYAxis must be a string");
      return chart;
    }
    ctx.formatYAxis = format;
    return chart;
  };

  /**
   * Sets the label for the y-axis.
   * @param label - A string specifying the y-axis label.
   * @returns The chart instance for chaining.
   */
  chart.yAxisLabel = (label: string) => {
    if (typeof label !== "string") {
      console.warn("yAxisLabel must be a string");
      return chart;
    }
    ctx.yAxisLabel = label;
    return chart;
  };

  /**
   * Sets the label for the x-axis.
   * @param label - A string specifying the x-axis label.
   * @returns The chart instance for chaining.
   */
  chart.xAxisLabel = (label: string) => {
    if (typeof label !== "string") {
      console.warn("xAxisLabel must be a string");
      return chart;
    }
    ctx.xAxisLabel = label;
    return chart;
  };

  /**
   * Sets the tooltip for the chart.
   * @param tooltipInstance - A valid TipVizTooltip instance.
   * @returns The chart instance for chaining.
   */
  chart.tooltip = (tooltipInstance: TipVizTooltip) => {
    if (typeof tooltipInstance !== "object" || tooltipInstance == null) {
      console.warn("tooltip must be a valid TipVizTooltip instance");
      return chart;
    }
    ctx.tooltip = tooltipInstance;
    return chart;
  };

  /**
   * Resets the zoom to the original x-axis domain.
   * @returns The chart instance for chaining.
   */
  chart.resetZoom = () => {
    resetZoomBrush(ctx as ChartContext, redrawChart);
    return chart;
  };

  return chart;
};
