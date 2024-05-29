import ReceptionStatus from "../dataStructures/receptionStatus.ts";

export default interface MessageHeader {
  time: Date;
  status: ReceptionStatus | string;
  sender: string | null;
  receiver: string | null;
  message_type: string;
  message_id: string | null;
}
