import Role from "./dataStructures/role"
import MessageHeader from "./messageHeader"

export default interface ResourceManagerDetails{
    header: MessageHeader
    resource_id: string
    name: string
    roles: Role[]
    manufacturer: string
    model: string
    serial_number: string
    firmware_version: string
    instruction_processing_delay: number
    available_control_types: ControlType[]
    currency: string
    provides_forecast: boolean
    provides_power_measurement_types: CommodityQuantity[]
}