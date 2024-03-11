import MessageHeader from "./messageHeader"

export default interface Handshake{
    header: MessageHeader
    role: string
    supported_protocol_versions: string[]
}