import "./src/index";
import { csv } from "d3";

const parseRow = (d: any) => ({
  hour: +d.Hour,
  temperature: +d.Temperature,
});

const data = await csv("./data/temperatures.csv", parseRow);

const chart = document.querySelector("#chart");
if (!chart) {
  throw new Error("Chart element not found");
}

chart.config = {
  data,
  xSerie: {
    accessor: (d: any) => d.hour,
    label: "Hour",
  },
  ySeries: [
    {
      accessor: (d: any) => d.temperature,
      label: "Temperature (°C)",
    },
  ],
};

// chart.tooltipContent(({ x, y }: any) =>
//   /*html*/ `
//   <ul>
//     <li>${x.toLocaleDateString()}</li>
//     <li>${y}</li>
//   </ul>
// `.trim()
// );
