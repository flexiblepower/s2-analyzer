import MessageHeader from "./messageHeader"

export default interface Handshake{
    header: MessageHeader
    subject_message_id: string
    status: string
}