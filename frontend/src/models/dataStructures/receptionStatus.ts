import { ReceptionStatusValues } from "./receptionStatusValues.ts";

export default interface ReceptionStatus {
  time: Date;
  sender: string | null;
  receiver: string | null;
  message_type: string;
  message_id: string | null;
  subject_message_id: string;
  status: ReceptionStatusValues;
  diagnostic_label: string | null;
}
