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

export class ChartEventEmitter extends EventTarget {
  emit<T extends ChartEventType>(eventType: T, data: ChartEventData[T]): void {
    const event = new CustomEvent(eventType, {
      detail: { ...data, timestamp: Date.now() }
    });
    this.dispatchEvent(event);
  }

  on<T extends ChartEventType>(
    eventType: T,
    handler: (event: CustomEvent<ChartEventData[T] & { timestamp: number }>) => void
  ): void {
    this.addEventListener(eventType, handler as EventListener);
  }

  off<T extends ChartEventType>(
    eventType: T,
    handler: (event: CustomEvent<ChartEventData[T] & { timestamp: number }>) => void
  ): void {
    this.removeEventListener(eventType, handler as EventListener);
  }

  once<T extends ChartEventType>(
    eventType: T,
    handler: (event: CustomEvent<ChartEventData[T] & { timestamp: number }>) => void
  ): void {
    const wrappedHandler = (event: Event) => {
      handler(event as CustomEvent<ChartEventData[T] & { timestamp: number }>);
      this.removeEventListener(eventType, wrappedHandler);
    };
    this.addEventListener(eventType, wrappedHandler);
  }
}
