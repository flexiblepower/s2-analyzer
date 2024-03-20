import MessageHeader from "./messageHeader";

export default interface HandshakeResponse extends MessageHeader{
    selected_protocol_version: string
}