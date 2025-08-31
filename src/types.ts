export type ChartDataRow = Record<string, unknown>;

export interface LineVizSeriesConfig<T = ChartDataRow> {
  accessor: (row: T) => number;
  label: string;
  color?: string;
}

export interface LineVizConfig<T = ChartDataRow> {
  data: T[];
  xSerie: {
    accessor: (row: T) => number;
    label?: string;
    // format?: string;
  };
  ySeries: Array<LineVizSeriesConfig<T>>;
}

export interface MarginConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
