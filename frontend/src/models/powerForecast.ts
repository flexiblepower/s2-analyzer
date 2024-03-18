import PowerForecastElement from "./dataStructures/powerForecastElement"
import MessageHeader from "./messageHeader"

export default interface PowerForecast{
    header: MessageHeader
    start_time: Date
    elements: PowerForecastElement[]
}