import MessageHeader from "./messageHeader"

export default interface SessionRequest{
    header: MessageHeader
    request: SessionRequestType
    diagnostic_label: string
}