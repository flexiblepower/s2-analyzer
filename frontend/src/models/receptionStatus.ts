import MessageHeader from "./messageHeader"
import {ReceptionStatusValues} from "./dataStructures/receptionStatusValues.ts";

export default interface ReceptionStatus extends MessageHeader{
    subject_message_id: string
    status: ReceptionStatusValues
    diagnostic_label: string | null
}