import UsageForecastElement from "../dataStructures/frbc/usageForecastElement";
import MessageHeader from "../messageHeader";

export default interface UsageForecast extends MessageHeader{
    start_time: Date
    elements: UsageForecastElement[]
}