import PowerForecastElement from "../dataStructures/powerForecastElement"
import MessageHeader from "./messageHeader"

export default interface PowerForecast extends MessageHeader{
    start_time: Date
    elements: PowerForecastElement[]
}