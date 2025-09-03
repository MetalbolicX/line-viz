import type { ChartDataRow, LineVizSeriesConfig } from "../types";

export class DataService {
  static filterData(data: ChartDataRow[], selectedSeries: string, hiddenSeries: Set<string>): ChartDataRow[] {
    return data; // Implement filtering logic
  }

  static filterSeries(series: LineVizSeriesConfig[], selectedSeries: string, hiddenSeries: Set<string>): LineVizSeriesConfig[] {
    if (selectedSeries === "All") {
      return series.filter(({ label }) => !hiddenSeries.has(label));
    }
    return series.filter(({ label }) => label === selectedSeries && !hiddenSeries.has(label));
  }

  static validateDataStructure(data: ChartDataRow[]): boolean {
    return Array.isArray(data) && data.length > 0;
  }

  static extractDataExtent(data: ChartDataRow[], accessor: (d: ChartDataRow) => number): [number, number] | null {
    if (!this.validateDataStructure(data)) return null;

    const values = data.map(accessor).filter(v => typeof v === "number" && !isNaN(v));
    if (values.length === 0) return null;

    return [Math.min(...values), Math.max(...values)];
  }
}
