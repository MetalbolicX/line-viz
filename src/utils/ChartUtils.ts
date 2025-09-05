import type { Selection } from "d3";
import type { ChartContext, ChartDimensions } from "../context/ChartContext";

/**
 * Utility function to get the size of the SVG element.
 */
export const getSize = (
  selection: Selection<SVGElement, unknown, null, undefined>
): ChartDimensions => {
  const { width = 0, height = 0 } =
    selection.node()?.getBoundingClientRect() || {};

  return { width, height, innerWidth: 0, innerHeight: 0 };
};

/**
 * Calculates inner dimensions based on SVG size and margin.
 */
export const calculateInnerDimensions = (
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number }
): { innerWidth: number; innerHeight: number } => {
  const innerWidth = width - (margin.left + margin.right);
  const innerHeight = height - (margin.top + margin.bottom);

  return { innerWidth, innerHeight };
};

/**
 * Validates that the chart setup is correct.
 */
export const validateSetup = (ctx: Partial<ChartContext>): boolean => {
  if (!ctx.series || !Array.isArray(ctx.series) || !ctx.series.length) {
    console.warn("[d3-line-viz] Chart series is missing or empty.");
    return false;
  }

  if (!ctx.data || !Array.isArray(ctx.data) || !ctx.data.length) {
    console.warn("[d3-line-viz] Chart data is missing or empty.");
    return false;
  }

  if (typeof ctx.xSerie !== "function") {
    console.warn("[d3-line-viz] xSerie accessor is missing.");
    return false;
  }

  if (
    !ctx.colorScale ||
    typeof ctx.colorScale !== "function" ||
    typeof ctx.colorScale.domain !== "function" ||
    typeof ctx.colorScale.range !== "function"
  ) {
    console.warn("[d3-line-viz] colorScale is missing or invalid.");
    return false;
  }

  return true;
};
