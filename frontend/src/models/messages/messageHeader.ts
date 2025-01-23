import ReceptionStatus from "../dataStructures/receptionStatus.ts";

export default interface MessageHeader {
    message_id: string;
    message_type: string;
    sender: string | null;
    receiver: string | null;
    time: Date;
    status: ReceptionStatus | string;
}
