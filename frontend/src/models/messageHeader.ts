export default interface MessageHeader{
   time: Date
   status: string | null
   sender: string | null
   receiver: string | null
   message_type: string
   message_id: string | null
}