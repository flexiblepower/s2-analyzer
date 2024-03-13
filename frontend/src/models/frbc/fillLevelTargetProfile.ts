import FillLevelTargetProfileElement from "../dataStructures/frbc/fillLevelTargetProfileElement";
import MessageHeader from "../messageHeader";

export default interface FillLevelTargetProfile{
    header: MessageHeader
    start_time: Date
    elements: FillLevelTargetProfileElement[]
}