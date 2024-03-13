import MessageHeader from "./messageHeader"

export default interface InstructionStatusUpdate{
    header: MessageHeader
    instruction_id: string
    status_type: InstructionStatus
    timestamp: Date
}