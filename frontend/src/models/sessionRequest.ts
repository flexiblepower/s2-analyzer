import MessageHeader from "./messageHeader"
import {SessionRequestType} from "./dataStructures/sessionRequestType.ts";

export default interface SessionRequest extends MessageHeader{
    request: SessionRequestType
    diagnostic_label: string | null
}