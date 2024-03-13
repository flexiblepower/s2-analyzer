import PowerValue from "./dataStructures/powerValue"
import MessageHeader from "./messageHeader"

export default interface PowerMeasurment{
    header: MessageHeader
    measurment_timestamp: Date
    values: PowerValue[]
}