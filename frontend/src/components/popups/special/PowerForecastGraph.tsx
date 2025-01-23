import PowerForecastElement from "../../../models/dataStructures/powerForecastElement.ts";
import {Line} from "react-chartjs-2";
import {Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip} from "chart.js";
import {CommodityQuantity} from "../../../models/dataStructures/commodityQuantity.ts";
import {getDurationTimestamps} from "../../../utils/util.ts";

interface Props {
    data: PowerForecastElement[];
    start: Date;
}

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

/**
 * The component for rendering the PowerForecast's power_value graph
 * @param props - The properties object, including data and start date
 * @returns The PowerForecast's power_value graph
 */
function PowerForecastGraph(props: Props) {
    const getIndex = (
        com: string,
        labels: CommodityQuantity[],
        maxElements: number
    ) => {
        for (let k = 0; k < maxElements; k++) {
            if (labels[k] == com) {
                return k;
            }
        }
        return -1;
    };

    const cleanUpMatrix = (raw: number[][], labels: CommodityQuantity[]) => {
        const matrix = [] as number[][];
        const labs = [] as string[];
        for (let i = 0; i < labels.length; i++) {
            if (raw[i].reduce((a, b) => a + b, 0) >= 0) {
                matrix.push(raw[i]);
                labs.push(labels[i]);
            }
        }
        return {matrix, labs};
    };

    const getExpectedMatrix = (labels: CommodityQuantity[]) => {
        const maxElements = labels.length;
        const length = props.data.length;
        const matrix = Array.from({length: maxElements}, () =>
            Array.from({length: length}, () => -1)
        );
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < props.data[i].power_values.length; j++) {
                const row = getIndex(
                    props.data[i].power_values[j].commodity_quantity,
                    labels,
                    maxElements
                );
                if (row != -1) {
                    let column = 0;
                    while (matrix[row][column] != -1) {
                        column = column + 1;
                    }
                    matrix[row][column] = props.data[i].power_values[j].value_expected;
                }
            }
        }
        return cleanUpMatrix(matrix, labels);
    };

    const collectGraphData = () => {
        const {matrix, labs} = getExpectedMatrix(
            Object.values(CommodityQuantity)
        );
        const xData = getDurationTimestamps(props.data, props.start);

        xData.unshift(props.start.getMilliseconds());
        for (let i = 0; i < matrix.length; i++) {
            matrix[i].push(matrix[i][matrix[i].length - 1]);
        }

        const labs2 = labs.map((str) => {
            const w = str.split(".");
            return w.map((e) => e.substring(0, 2)).join(".");
        });

        return {
            labels: xData,
            datasets: matrix.map((row, i) => ({
                label: labs2[i],
                data: row,
                borderColor: `rgba(${255 / i}, ${255 * i}, ${255 % i})`,
                backgroundColor: "rgb(75, 192, 192)",
                stepped: true,
                tension: 0,
            })),
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
            <Line data={collectGraphData()} width={100} height={200} options={options}/>
        </div>
    );
}

export default PowerForecastGraph;
