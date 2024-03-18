import LeakageBehaviourElement from "../dataStructures/frbc/leakagebehaviourElement";
import MessageHeader from "../messageHeader";

export default interface LeakageBehaviour{
    header: MessageHeader
    valid_from: Date
    elements: LeakageBehaviourElement[]
}