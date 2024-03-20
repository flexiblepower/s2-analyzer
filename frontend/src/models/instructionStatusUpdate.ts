import MessageHeader from "./messageHeader"
import {InstructionStatus} from "./dataStructures/instructionStatus.ts";

export default interface InstructionStatusUpdate extends MessageHeader{
    instruction_id: string
    status_type: InstructionStatus
    timestamp: Date
}