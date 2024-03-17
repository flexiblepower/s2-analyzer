import MessageHeader from "./messageHeader";
import {ControlType} from "./dataStructures/controlType.ts";

export default interface SelectControlType{
    header: MessageHeader
    control_type: ControlType
}