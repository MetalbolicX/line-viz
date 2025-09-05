import { MarginConfig } from "../types";

/**
 * Manages the dimensions and margins of an SVG container for chart rendering.
 */
export class ChartDimensions {
  #margin: MarginConfig;
  #height: number;
  #width: number;

  /**
   * Creates an instance of ChartFrame.
   * @param svgContainer - The SVG element that serves as the container for the chart.
   * @param margin - The margin configuration for the chart.
   * @example
   * ```ts
   * const svgElement = document.querySelector("svg");
   * const margin = { top: 20, right: 30, bottom: 30, left: 40 };
   * const chartFrame = new ChartFrame(svgElement, margin);
   * ```
   */
  constructor(svgContainer: SVGElement, margin: MarginConfig) {
    this.#margin = { ...margin };
    this.#width = svgContainer.clientWidth;
    this.#height = svgContainer.clientHeight;
  }

  public get margin(): MarginConfig {
    return { ...this.#margin };
  }

  /**
   * Gets the inner width of the chart area, excluding margins.
   */
  public get innerWidth(): number {
    return (
      this.width - this.margin.left - this.margin.right
    );
  }

  /**
   * Gets the inner height of the chart area, excluding margins.
   */
  public get innerHeight(): number {
    return (
      this.height - this.margin.top - this.margin.bottom
    );
  }

  public set margin(margin: Partial<MarginConfig>) {
    this.#margin = { ...this.#margin, ...margin };
  }

  /**
   * Gets the x-axis range, accounting for margins.
   */
  public get innerXRange(): [number, number] {
    return [this.margin.left, this.innerWidth + this.margin.left];
  }

  /**
   * Gets the y-axis range, accounting for margins.
   */
  public get innerYRange(): [number, number] {
    return [this.innerHeight + this.margin.top, this.margin.top];
  }

  /**
   * Indicates whether the chart area has valid dimensions (greater than zero).
   */
  public get areValidDimensions(): boolean {
    return this.innerWidth > 0 && this.innerHeight > 0;
  }

  public get width(): number {
    return this.#width;
  }

  public get height(): number {
    return this.#height;
  }
}
