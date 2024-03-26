import PowerForecastElement from "../../../models/dataStructures/powerForecastElement.ts";
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
    data: PowerForecastElement[]
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
 * The component for rendering the PowerForecast's power_value graph.
 * @returns the PowerForecast's power_value graph
 */
function PowerForecastGraph(props: Props) {

    const graphData = {
        labels: props.data.map(el => (props.start.getMilliseconds() + el.duration)%1000),
        datasets: props.data.map(el => (
            {
                label: el.power_values[0].commodity_quantity,
                data: props.data.map(el=>(el.power_values.map(value => value.value_expected))).flat(),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgb(75, 192, 192)',
                tension: 0.1,
        }))
    };

    return (
        <div className={"justify-center items-center flex"}>
            <Line data={graphData}/>
        </div>
    );
}

export default PowerForecastGraph;