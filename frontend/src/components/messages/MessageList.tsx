import MessageCard from "./MessageCard.tsx";
import MessageHeader from "../../models/messages/messageHeader.ts";

interface props<T extends MessageHeader> {
    messages: T[];
}

/**
 * The component for rendering the MessageList
 * @param props - The properties for the MessageList component, including an array of messages of type T
 * @returns The MessageList component
 */
function MessageList<T extends MessageHeader>(props: props<T>) {
    return (
        <div>
            <ul>
                {props.messages.map((m, index) => (
                    <li key={index} className="mt-4">
                        {/* Renders a MessageCard for each message */}
                        <MessageCard<T> message={m}/>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default MessageList;
