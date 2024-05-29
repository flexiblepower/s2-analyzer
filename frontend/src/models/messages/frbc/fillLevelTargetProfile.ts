import FillLevelTargetProfileElement from "../../dataStructures/frbc/fillLevelTargetProfileElement";
import MessageHeader from "../messageHeader";

export default interface FillLevelTargetProfile extends MessageHeader {
  start_time: Date;
  elements: FillLevelTargetProfileElement[];
}
