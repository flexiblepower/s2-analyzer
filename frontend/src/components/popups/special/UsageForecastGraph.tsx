import UsageForecastElement from "../../../models/dataStructures/frbc/usageForecastElement.ts";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";

interface Props {
  data: UsageForecastElement[];
  start: Date;
}

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip
);

/**
 * The component for rendering the UsageForecast's graph
 * @param props - The props containing the usage forecast data and start date
 * @returns the UsageForecast's graph
 */
function PowerForecastGraph(props: Props) {
  /**
   * Generates an array of timestamps based on the duration of each data element
   * @returns An array of timestamps
   */
  const getDurationTimestamps = () => {
    const array = [] as number[];
    for (let i = 0; i < props.data.length; i++) {
      // Calculate the timestamp, ensuring it wraps around at 1000 miliseconds
      array.push(
        (props.data[i].duration +
          (i == 0 ? props.start.getMilliseconds() : array[i - 1])) %
          1000
      );
    }
    return array;
  };

  /**
   * Collects the data for the graph including timestamps and usage rates
   * @returns The data object for the chart
   */
  const collectGraphData = () => {
    const yData = props.data.map((el) => el.usage_rate_expected);
    const xData = getDurationTimestamps();

    // Add the starting timstamp and ensure the graph etends to the end
    xData.unshift(props.start.getMilliseconds());
    yData.push(yData[yData.length - 1]);

    return {
      labels: xData,
      datasets: [
        {
          label: "Usage",
          data: yData,
          borderColor: `rgba(65, 182, 182)`,
          backgroundColor: "rgb(75, 192, 192)",
          stepped: true,
          tension: 0,
        },
      ],
    };
  };

  const options = {
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Time (ms)",
        },
      },
    },
  };

  return (
    <div className={"flex justify-center items-center bg-white"}>
      <Line
        data={collectGraphData()}
        width={100}
        height={200}
        options={options}
      />
    </div>
  );
}

export default PowerForecastGraph;
