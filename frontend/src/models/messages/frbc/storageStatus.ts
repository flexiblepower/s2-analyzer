import MessageHeader from "../messageHeader";

export default interface StorageStatus extends MessageHeader {
  present_fill_level: number;
}
