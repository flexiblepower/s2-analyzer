import MessageHeader from "../messageHeader";

export default interface StorageStatus{
    header: MessageHeader
    present_fill_level: number
}