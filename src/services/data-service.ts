import type { ChartDataRow, LineVizSeriesConfig } from "@/types";

/**
 * Creates a data service for managing chart data.
 * @returns An object containing data service methods.
 */
const createDataService = () => {
  /**
   * Filters the data based on a provided filter function.
   * @param series - All series in the chart.
   * @param selectedSeries - The currently selected series label or "All".
   * @param hiddenSeries - A set of labels for series that are hidden.
   * @returns Filtered array of series based on selection and visibility.
   */
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

  /**
   * Validates the dataset for the chart.
   * @param data - The dataset to validate.
   * @returns True if the dataset is valid, false otherwise.
   */
  const validateDataSet = (data: ChartDataRow[]): boolean => {
    return Array.isArray(data) && data.length > 0;
  };

  /**
   * Gets the data domain (min/max values) for the specified accessors.
   * @param data - The dataset to analyze.
   * @param accessors - An array of accessor functions to extract values from the data.
   * @returns The data domain as a tuple [min, max] or null if invalid.
   */
  const getDataDomain = (
    data: ChartDataRow[],
    accessors: ((d: ChartDataRow) => number)[]
  ): [number, number] | null => {
    if (!validateDataSet(data) || !accessors.length) return null;

    const values = Iterator.from(accessors)
      .flatMap((accessor) => data.map((d) => accessor(d)))
      .filter((value) => typeof value === "number" && !isNaN(value))
      .toArray();
    if (!values.length) return null;

    return [Math.min(...values), Math.max(...values)];
  };

  return {
    selectedSeries,
    validateDataSet,
    getDataDomain,
  };
};

export const DataService = createDataService();
