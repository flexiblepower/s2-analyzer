import {ReceptionStatusValues} from "./receptionStatusValues.ts";

export default interface ReceptionStatus {
    message_id: string;
    message_type: string;
    sender: string | null;
    receiver: string | null;
    time: Date;
    subject_message_id: string;
    status: ReceptionStatusValues;
    diagnostic_label: string | null;
}
