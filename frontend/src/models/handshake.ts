import MessageHeader from "./messageHeader"

export default interface Handshake{
    header: MessageHeader
    role: EnergyManagementRole
    supported_protocol_versions: string[]
}