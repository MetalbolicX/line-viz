export type ChartEventType =
  | "data-changed"
  | "series-changed"
  | "zoom-changed"
  | "config-changed"
  | "render-complete"
  | "interaction-start"
  | "interaction-end";

export interface ChartEventData {
  "data-changed": { data: any[]; timestamp: number };
  "series-changed": { selectedSeries: string; hiddenSeries: Set<string> };
  "zoom-changed": { domain: [number, number] | null; isZoomed: boolean };
  "config-changed": { config: any };
  "render-complete": { renderTime: number };
  "interaction-start": { type: string };
  "interaction-end": { type: string };
}
