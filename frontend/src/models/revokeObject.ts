import MessageHeader from "./messageHeader"
import {RevokableObjects} from "./dataStructures/revokableObjects.ts";

export default interface RevokeObject{
    header: MessageHeader
    object_type: RevokableObjects
    object_id: string
}