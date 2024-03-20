import MessageHeader from "../messageHeader";

export default interface TimerStatus extends MessageHeader{
    timer_id: string
    actuator_id: string
    finished_at: Date
}