import MessageHeader from "../messageHeader";

export default interface Instruction extends MessageHeader {
  id: string;
  actuator_id: string;
  operation_mode: string;
  operation_mode_factor: number;
  execution_time: Date;
  abnormal_condition: boolean;
}
