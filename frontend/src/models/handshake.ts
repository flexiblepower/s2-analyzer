import MessageHeader from "./messageHeader"
import {EnergyManagementRole} from "./dataStructures/energyManagementRole.ts";

export default interface Handshake{
    header: MessageHeader
    role: EnergyManagementRole
    supported_protocol_versions: string[] | null
}