import UsageForecastElement from "../../models/dataStructures/frbc/usageForecastElement.ts";
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Legend,
    Tooltip
} from "chart.js";

interface Props {
    data: UsageForecastElement[]
    start: Date
}

ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Legend,
    Tooltip)

/**
 * The component for rendering the UsageForecast's graph.
 * @returns the UsageForecast's graph
 */
function PowerForecastGraph(props: Props) {
    const getDurationTimestamps = () => {
        const array = [] as number[]
        for (let i=0; i<props.data.length; i++) {
            array.push((props.data[i].duration + (i==0 ? props.start.getMilliseconds() : array[i-1]))%1000)
        }
        return array
    }

    const collectGraphData = () => {
        const yData = props.data.map(el => el.usage_rate_expected)
        const xData = getDurationTimestamps()

        xData.unshift(props.start.getMilliseconds())
        yData.push(yData[yData.length-1])

        return {
            labels: xData,
            datasets: [{
                    label: "Usage",
                    data: yData,
                    borderColor: `rgba(65, 182, 182)`,
                    backgroundColor: 'rgb(75, 192, 192)',
                    stepped: true,
                    tension: 0,
                }]
        };
    }

    return (
        <div className={"flex justify-center items-center"}>
            <Line data={collectGraphData()} width={100} height={200}/>
        </div>
    );
}

export default PowerForecastGraph;