import type { MarginConfig } from "../types";

export interface ChartConfig {
  transitionTime: number;
  xTicks: number;
  yTicks: number;
  margin: MarginConfig;
  formatXAxis: string;
  formatYAxis: string;
  yAxisLabel: string;
  xAxisLabel: string;
  isCurved: boolean;
  isStatic: boolean;
}

export class ConfigurationManager {
  private static readonly DEFAULT_CONFIG: ChartConfig = {
    transitionTime: 0,
    xTicks: 5,
    yTicks: 5,
    margin: { top: 30, right: 40, bottom: 30, left: 40 },
    formatXAxis: ".2f",
    formatYAxis: ".2f",
    yAxisLabel: "",
    xAxisLabel: "",
    isCurved: false,
    isStatic: false,
  };

  static getDefaultConfig(): ChartConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  static validateConfig(config: Partial<ChartConfig>): string[] {
    const errors: string[] = [];

    if (config.transitionTime !== undefined && (typeof config.transitionTime !== "number" || config.transitionTime < 0)) {
      errors.push("transitionTime must be a non-negative number");
    }

    if (config.xTicks !== undefined && (typeof config.xTicks !== "number" || config.xTicks < 0)) {
      errors.push("xTicks must be a non-negative number");
    }

    if (config.yTicks !== undefined && (typeof config.yTicks !== "number" || config.yTicks < 0)) {
      errors.push("yTicks must be a non-negative number");
    }

    if (config.isCurved !== undefined && typeof config.isCurved !== "boolean") {
      errors.push("isCurved must be a boolean");
    }

    if (config.isStatic !== undefined && typeof config.isStatic !== "boolean") {
      errors.push("isStatic must be a boolean");
    }

    return errors;
  }

  static mergeConfigs(base: ChartConfig, override: Partial<ChartConfig>): ChartConfig {
    const validationErrors = this.validateConfig(override);
    if (validationErrors.length > 0) {
      console.warn("Configuration validation errors:", validationErrors);
    }

    return {
      ...base,
      ...override,
      margin: override.margin ? { ...base.margin, ...override.margin } : base.margin,
    };
  }

  static createFromAttributes(element: HTMLElement): Partial<ChartConfig> {
    const config: Partial<ChartConfig> = {};

    const isStatic = element.getAttribute("is-static");
    if (isStatic !== null) config.isStatic = true;

    const transitionTime = element.getAttribute("transition-time");
    if (transitionTime) config.transitionTime = Number(transitionTime);

    const isCurved = element.getAttribute("is-curved");
    if (isCurved !== null) config.isCurved = true;

    const xTicks = element.getAttribute("x-ticks");
    if (xTicks) config.xTicks = Number(xTicks);

    const yTicks = element.getAttribute("y-ticks");
    if (yTicks) config.yTicks = Number(yTicks);

    const formatXAxis = element.getAttribute("format-x-axis");
    if (formatXAxis) config.formatXAxis = formatXAxis;

    const formatYAxis = element.getAttribute("format-y-axis");
    if (formatYAxis) config.formatYAxis = formatYAxis;

    const yAxisLabel = element.getAttribute("y-axis-label");
    if (yAxisLabel) config.yAxisLabel = yAxisLabel;

    const xAxisLabel = element.getAttribute("x-axis-label");
    if (xAxisLabel) config.xAxisLabel = xAxisLabel;

    const margin = element.getAttribute("margin");
    if (margin) {
      try {
        config.margin = JSON.parse(margin);
      } catch (e) {
        console.error("Failed to parse margin attribute:", e);
      }
    }

    return config;
  }
}
