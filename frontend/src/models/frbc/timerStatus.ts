import MessageHeader from "../messageHeader";

export default interface TimerStatus{
    header: MessageHeader
    timer_id: string
    actuator_id: string
    finished_at: Date
}