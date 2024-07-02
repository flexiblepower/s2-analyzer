import MessageHeader from "./messageHeader";
import { EnergyManagementRole } from "../dataStructures/energyManagementRole.ts";

export default interface Handshake extends MessageHeader {
  role: EnergyManagementRole;
  supported_protocol_versions: string[] | null;
}
