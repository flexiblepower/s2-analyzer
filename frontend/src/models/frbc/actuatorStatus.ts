import MessageHeader from "../messageHeader";

export default interface ActuatorStatus{
    header: MessageHeader
    actuator_id: string
    active_operation_mode_id: string
    operation_mode_factor: number
    previous_operation_mode_id: string
    transition_timestamp: Date
}