import type { ChartDataRow, LineVizSeriesConfig } from "../types";

const createDataService = () => {
  const filterBy = (
    data: ChartDataRow[],
    selectedSeries: string,
    hiddenSeries: Set<string>
  ): ChartDataRow[] => {
    return data; // Implement filtering logic
  };

  const selectedSeries = (
    series: LineVizSeriesConfig[],
    selectedSeries: string,
    hiddenSeries: Set<string>
  ): LineVizSeriesConfig[] => {
    if (selectedSeries === "All") {
      return series.filter(({ label }) => !hiddenSeries.has(label));
    }
    return series.filter(
      ({ label }) => label === selectedSeries && !hiddenSeries.has(label)
    );
  };

  const validateDataSet = (data: ChartDataRow[]): boolean => {
    return Array.isArray(data) && data.length > 0;
  };

  const getDataDomain = (
    data: ChartDataRow[],
    accessor: (d: ChartDataRow) => number
  ): [number, number] | null => {
    if (!validateDataSet(data)) return null;

    const values = data
      .map(accessor)
      .filter((value) => typeof value === "number" && !isNaN(value));
    if (!values.length) return null;

    return [Math.min(...values), Math.max(...values)];
  };

  return {
    filterBy,
    selectedSeries,
    validateDataSet,
    getDataDomain,
  };
};

export const DataService = createDataService();
