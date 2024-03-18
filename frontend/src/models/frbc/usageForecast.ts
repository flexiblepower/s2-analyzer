import UsageForecastElement from "../dataStructures/frbc/usageForecastElement";
import MessageHeader from "../messageHeader";

export default interface UsageForecast{
    header: MessageHeader
    start_time: Date
    elements: UsageForecastElement[]
}