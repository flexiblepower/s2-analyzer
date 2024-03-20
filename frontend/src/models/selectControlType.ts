import MessageHeader from "./messageHeader";
import {ControlType} from "./dataStructures/controlType.ts";

export default interface SelectControlType extends MessageHeader{
    control_type: ControlType
}