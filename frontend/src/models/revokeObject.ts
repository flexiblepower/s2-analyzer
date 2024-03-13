import MessageHeader from "./messageHeader"

export default interface RevokeObject{
    header: MessageHeader
    object_type: RevokableObjects
    object_id: string
}