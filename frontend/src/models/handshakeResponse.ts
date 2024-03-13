import MessageHeader from "./messageHeader";

export default interface HandshakeResponse{
    header: MessageHeader
    selected_protocol_version: string
}