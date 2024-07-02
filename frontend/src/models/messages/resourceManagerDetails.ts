import Role from "../dataStructures/role";
import MessageHeader from "./messageHeader";
import { ControlType } from "../dataStructures/controlType.ts";
import { CommodityQuantity } from "../dataStructures/commodityQuantity.ts";

export default interface ResourceManagerDetails extends MessageHeader {
  resource_id: string;
  name: string | null;
  roles: Role[];
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  firmware_version: string | null;
  instruction_processing_delay: number;
  available_control_types: ControlType[];
  currency: string | null;
  provides_forecast: boolean;
  provides_power_measurement_types: CommodityQuantity[];
}
