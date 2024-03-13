import MessageHeader from "./messageHeader"

export default interface ReceptionStatus{
    header: MessageHeader
    subject_message_id: string
    status: ReceptionStatusValues
    diagnosic_label: string
}