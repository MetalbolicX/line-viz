import { select, scaleOrdinal, schemeCategory10 } from "d3";
import type {
  LineVizConfig,
  LineVizSeriesConfig,
  ChartDataRow,
  ChartEventData,
  ChartEventType,
  ChartConfig,
} from "./types";
import { createLineVizChart } from "./d3-line-viz";
import { ChartEventEmitter } from "./events/chart-event-emitter";
import { DataService, ConfigurationManager } from "./services";
import "tipviz";
import { TipVizTooltip } from "tipviz";

export class LineViz extends HTMLElement {
  // Event emitter for chart communication
  #eventEmitter = new ChartEventEmitter();

  // Configuration management
  #chartConfig: ChartConfig;

  // Chart state
  private declare _config: LineVizConfig;
  private declare _data: ChartDataRow[];
  private declare _selectedSeries: string;
  private declare _hiddenSeries: Set<string>;

  // DOM elements
  #svgRef!: SVGElement;
  #colorScale = scaleOrdinal(schemeCategory10);
  private declare _tooltip: TipVizTooltip;
  #shadowRoot: ShadowRoot;
  #selectElement!: HTMLSelectElement;
  #resetButton!: HTMLButtonElement;

  public static get observedAttributes() {
    return [
      "is-static",
      "transition-time",
      "is-curved",
      "margin",
      "x-ticks",
      "y-ticks",
      "format-x-axis",
      "format-y-axis",
      "y-axis-label",
      "x-axis-label",
    ];
  }

  public static get styles(): string {
    return /*css*/ `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
  }

  section {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 1rem;
    padding: 1rem;
    box-sizing: border-box;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .controls-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .controls-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    font-size: 0.9em;
  }

  input[type="date"] {
    padding: 0.4rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    font-size: 0.9em;
  }

  figure {
    flex: 1;
    margin: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  svg {
    width: 100%;
    height: 100%;
    border: 1px solid #e0e0e0;
    background: white;
  }

  button {
    padding: 0.5rem 1rem;
    border: 1px solid #007acc;
    border-radius: 0.25em;
    background: #007acc;
    color: white;
    cursor: pointer;
    font-size: 0.9em;
    transition: background-color 0.2s;
  }

  button:hover {
      background: darken(#007acc, 5%);
  }

  button:disabled {
      background: #ccc;
      border-color: #ccc;
      cursor: not-allowed;
  }

  .chart-title {
    text-align: center;
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .axis {
    font-size: 0.7em;
  }

  .grid {
    stroke: #e0e0e0;
    stroke-width: 1;
    stroke-dasharray: 2, 2;
  }

  .grid path {
    stroke-width: 0;
  }

  .series {
    opacity: 0.6;
    transition: opacity 0.3s;
  }

  .series .serie {
    fill: none;
    stroke-width: 2;
  }

  .series:has(.serie:hover, .point:hover) .series-group:not(:hover) {
    opacity: 0.3;
  }

  .series:has(.serie:hover, .point:hover) .series-group:hover {
    opacity: 1;
  }

  .series:has(.serie:hover, .point:hover) .series-group:hover .serie {
    stroke-width: 4;
  }

  .cursor.hidden {
    visibility: hidden;
  }

  .cursor.point {
    fill: white;
    stroke-width: 2;
  }

  .cursor.vertical-line {
    stroke: #666;
    stroke-width: 1;
    stroke-dasharray: 3, 3;
    pointer-events: none;
  }

  .legend-item {
    pointer-events: none;
  }

  .legend-item text {
      font-size: 0.8em;
  }

  .legend-item rect {
    width: 1em;
    height: 1em;
    display: inline-block;
    margin-right: 0.5rem;
  }

  .axis-label {
    font-size: 0.8em;
    text-anchor: middle;
  }

  .brush .selection {
    fill: #007acc;
    fill-opacity: 0.15;
    stroke: #007acc;
    stroke-width: 1;
  }

  .brush .handle {
    fill: #007acc;
    opacity: 0.8;
  }

  .brush-container {
    pointer-events: all;
  }
  `.trim();
  }

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: "open" });

    // Initialize default configuration
    this.#chartConfig = ConfigurationManager.getDefaultConfig();

    // Initialize chart state
    this._data = [];
    this._selectedSeries = "All";
    this._hiddenSeries = new Set<string>();
    this._config = {
      data: [],
      xSerie: { accessor: (d: ChartDataRow) => d.x as number },
      ySeries: [],
    };

    this.#createDOM();
    this.#setupEventListeners();
  }

  /**
   * Called when the element is connected to the DOM.
   */
  public connectedCallback() {
    // Parse initial attributes
    const attributeConfig = ConfigurationManager.createFromAttributes(this);
    this.#chartConfig = ConfigurationManager.mergeConfigs(
      this.#chartConfig,
      attributeConfig
    );

    this.#addEventListeners();
    this.render();
  }

  /**
   * Called when the element is disconnected from the DOM.
   */
  public disconnectedCallback() {
    this.#removeEventListeners();
  }

  /**
   * Called when an observed attribute is changed.
   * @param name - The name of the attribute that changed.
   * @param oldValue - The old value of the attribute.
   * @param newValue - The new value of the attribute.
   * @returns {void}
   */
  public attributeChangedCallback(
    _name: string,
    oldValue: string,
    newValue: string
  ): void {
    if (oldValue === newValue) {
      return;
    }

    // Parse attributes and update configuration
    const attributeConfig = ConfigurationManager.createFromAttributes(this);
    this.#chartConfig = ConfigurationManager.mergeConfigs(
      ConfigurationManager.getDefaultConfig(),
      attributeConfig
    );

    // Emit configuration change event
    this.#eventEmitter.emit("config-changed", { config: this.#chartConfig });

    this.render();
  }

  /**
   * Sets the configuration for the line visualization.
   */
  public set config(cfg: LineVizConfig) {
    this._config = cfg;
    this._data = [...cfg.data];
    this._selectedSeries = "All";
    this._hiddenSeries = new Set<string>();

    // Emit data change event
    this.#eventEmitter.emit("data-changed", {
      data: this._data,
      timestamp: Date.now(),
    });

    this.render();
  }

  /**
   * Returns the labels for the Y-axis series.
   */
  public get ySeriesLabels(): string[] {
    return !this._config?.ySeries?.length
      ? []
      : this._config.ySeries.map(({ label }) => label);
  }

  /**
   * Returns the filtered series based on the selected and hidden series.
   */
  public get filteredSeries(): LineVizSeriesConfig[] {
    return !this._config?.ySeries?.length
      ? []
      : DataService.selectedSeries(
          this._config.ySeries,
          this._selectedSeries,
          this._hiddenSeries
        );
  }

  /**
   * Returns the filtered data based on the selected series and date range.
   */
  public get filteredData(): ChartDataRow[] {
    return !this._data.length ? [] : this._data;
  }

  /**
   * Sets the content of the tooltip.
   * @param content - A function that returns the HTML content for the tooltip.
   * @example
   * ```ts
   * tooltipContent((d) => `<strong>${d.x}</strong>: ${d.y}`);
   * ```
   */
  public tooltipContent(content: (...args: any[]) => string): void {
    this._tooltip.setHtml(content);
  }

  /**
   * Sets the styles for the tooltip.
   * @param css - A string containing the CSS styles to apply.
   * @returns {void}
   * @example
   * ```ts
   * tooltipStyle(`
   *   .tooltip {
   *     background-color: black;
   *     color: white;
   *   }
   * `);
   * ```
   */
  public tooltipStyle(css: string): void {
    if (!css) return;
    this._tooltip.setStyles(css);
  }

  /**
   * Subscribe to chart events.
   * @param eventType - The type of event to listen for.
   * @param handler - The event handler function.
   * @returns {void}
   */
  public on<T extends ChartEventType>(
    eventType: T,
    handler: (
      event: CustomEvent<
        ChartEventData[T] & {
          timestamp: number;
        }
      >
    ) => void
  ): void {
    this.#eventEmitter.on(eventType, handler);
  }

  /**
   * Unsubscribe from chart events.
   * @param eventType - The type of event to stop listening for.
   * @param handler - The event handler function to remove.
   * @returns {void}
   */
  public off<T extends ChartEventType>(
    eventType: T,
    handler: (
      event: CustomEvent<
        ChartEventData[T] & {
          timestamp: number;
        }
      >
    ) => void
  ): void {
    this.#eventEmitter.off(eventType, handler);
  }

  /**
   * Subscribe to a chart event that will only fire once.
   * @param eventType - The type of event to listen for.
   * @param handler - The event handler function.
   * @returns {void}
   */
  public once<T extends ChartEventType>(
    eventType: T,
    handler: (
      event: CustomEvent<
        ChartEventData[T] & {
          timestamp: number;
        }
      >
    ) => void
  ): void {
    this.#eventEmitter.once(eventType, handler);
  }

  /**
   * Handles changes to the selected series.
   * @param event The change event.
   */
  #handleSeriesChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    // const previousSelection = this._selectedSeries;
    this._selectedSeries = target.value;

    // Emit series change event
    this.#eventEmitter.emit("series-changed", {
      selectedSeries: this._selectedSeries,
      hiddenSeries: this._hiddenSeries,
    });

    this.#renderChart();
  };

  /**
   * Handles the reset zoom button click.
   * @returns {void}
   */
  #handleResetZoom = (): void => {
    if (!this.#svgRef) return;

    // Emit interaction events
    this.#eventEmitter.emit("interaction-start", { type: "reset-zoom" });

    const chart = createLineVizChart()
      .colorScale(this.#colorScale)
      .data(this.filteredData)
      .formatXAxis(this.#chartConfig.formatXAxis)
      .formatYAxis(this.#chartConfig.formatYAxis)
      .isCurved(this.#chartConfig.isCurved)
      .isStatic(this.#chartConfig.isStatic)
      .margin(this.#chartConfig.margin)
      .series(this.filteredSeries)
      .tooltip(this._tooltip)
      .transitionTime(this.#chartConfig.transitionTime)
      .xAxisLabel(this.#chartConfig.xAxisLabel)
      .xSerie(this._config.xSerie.accessor)
      .xTicks(this.#chartConfig.xTicks)
      .yAxisLabel(this.#chartConfig.yAxisLabel)
      .yTicks(this.#chartConfig.yTicks);

    // Reset zoom and re-render
    chart.resetZoom();
    select(this.#svgRef).call(chart);

    // Emit zoom change and interaction end events
    this.#eventEmitter.emit("zoom-changed", { domain: null, isZoomed: false });
    this.#eventEmitter.emit("interaction-end", { type: "reset-zoom" });
  };

  /**
   * Renders the chart.
   * @returns {void}
   */
  #renderChart(): void {
    if (!this.#svgRef || !this._data.length || !this._config.ySeries.length)
      return;

    const startTime = performance.now();

    const chart = createLineVizChart()
      .colorScale(this.#colorScale)
      .data(this.filteredData)
      .formatXAxis(this.#chartConfig.formatXAxis)
      .formatYAxis(this.#chartConfig.formatYAxis)
      .isCurved(this.#chartConfig.isCurved)
      .isStatic(this.#chartConfig.isStatic)
      .margin(this.#chartConfig.margin)
      .series(this.filteredSeries)
      .tooltip(this._tooltip)
      .transitionTime(this.#chartConfig.transitionTime)
      .xAxisLabel(this.#chartConfig.xAxisLabel)
      .xSerie(this._config.xSerie.accessor)
      .xTicks(this.#chartConfig.xTicks)
      .yAxisLabel(this.#chartConfig.yAxisLabel)
      .yTicks(this.#chartConfig.yTicks);

    select(this.#svgRef).call(chart);

    // Emit render complete event
    const endTime = performance.now();
    this.#eventEmitter.emit("render-complete", {
      renderTime: endTime - startTime,
    });
  }

  /**
   * Creates a DocumentFragment from an HTML string.
   * @param html - The HTML string to convert.
   * @returns A DocumentFragment containing the parsed HTML.
   */
  #fromString(html: string): DocumentFragment {
    const range = document.createRange();
    const fragment = range.createContextualFragment(html);
    return fragment;
  }

  /**
   * Creates the DOM elements for the component.
   */
  #createDOM() {
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(LineViz.styles);
    this.#shadowRoot.adoptedStyleSheets = [styleSheet];

    const template = this.#fromString(/*html*/ `
      <section>
        <div class="controls">
          <div class="controls-left">
            <select>
              <option value="All">All Series</option>
            </select>
          </div>
          <div class="controls-right">
            <button id="reset-zoom">Reset Zoom</button>
          </div>
        </div>
        <figure>
          <slot name="chart-title" class="chart-title"></slot>
          <svg
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Time Series Chart"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
          ></svg>
        </figure>
        <tip-viz-tooltip id="d3-tooltip" transition-time="250"></tip-viz-tooltip>
      </section>
    `);

    this.#shadowRoot.appendChild(template);

    this.#svgRef = this.#shadowRoot.querySelector("svg") as SVGElement;
    this._tooltip = this.#shadowRoot.querySelector(
      "#d3-tooltip"
    ) as TipVizTooltip;
    this.#selectElement = this.#shadowRoot.querySelector(
      "select"
    ) as HTMLSelectElement;
    this.#resetButton = this.#shadowRoot.querySelector(
      "#reset-zoom"
    ) as HTMLButtonElement;
  }

  /**
   * Sets up internal event listeners for the chart event emitter.
   * @returns {void}
   */
  #setupEventListeners(): void {
    // Listen for data changes to update UI
    this.#eventEmitter.on("data-changed", () => {
      this.#updateControls();
    });

    // Listen for series changes to update chart
    this.#eventEmitter.on("series-changed", () => {
      this.#updateControls();
    });

    // Listen for config changes to trigger re-render
    this.#eventEmitter.on("config-changed", () => {
      this.render();
    });
  }

  /**
   * Updates the control elements state.
   * @returns {void}
   */
  #updateControls(): void {
    const hasData = this._data.length > 0 && this._config.ySeries.length > 0;
    this.#selectElement.disabled = !hasData;
    this.#resetButton.disabled = !hasData;
  }

  /**
   * Adds DOM event listeners for the component.
   * @returns {void}
   */
  #addEventListeners(): void {
    this.#selectElement.addEventListener("change", this.#handleSeriesChange);
    this.#resetButton.addEventListener("click", this.#handleResetZoom);
  }

  /**
   * Removes event listeners for the component.
   * @returns {void}
   */
  #removeEventListeners(): void {
    this.#selectElement.removeEventListener("change", this.#handleSeriesChange);
    this.#resetButton.removeEventListener("click", this.#handleResetZoom);
    select(this.#svgRef)
      .on("pointermove", null)
      .on("pointerover", null)
      .on("pointerout", null);
  }

  /**
   * Renders the line visualization.
   * @returns {void} The rendered template.
   */
  public render() {
    const seriesLabels = this.ySeriesLabels;
    const hasData =
      DataService.validateDataSet(this._data) &&
      this._config.ySeries.length > 0;

    if (!hasData) return;

    // Update select options
    while (this.#selectElement.firstChild) {
      this.#selectElement.removeChild(this.#selectElement.firstChild);
    }

    const allOptions = document.createElement("option");
    allOptions.value = "All";
    allOptions.textContent = "All Series";
    allOptions.selected = this._selectedSeries === "All";

    const options = seriesLabels.map((label) => {
      const option = document.createElement("option");
      option.value = label;
      option.textContent = label;
      option.selected = this._selectedSeries === label;
      return option;
    });

    this.#selectElement.append(allOptions, ...options);

    // Update controls state
    this.#updateControls();

    this.#renderChart();
  }
}

customElements.define("line-viz", LineViz);

declare global {
  interface HTMLElementTagNameMap {
    "line-viz": LineViz;
  }
}
