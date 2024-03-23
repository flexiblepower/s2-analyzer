import MessageCard from "./MessageCard.tsx";
import MessageHeader from "../../models/messageHeader.ts";

interface props<T extends MessageHeader> {
  messages: T[];
}

/**
 * The component for rendering the MessageList
 * @returns the MessageList
 */
function MessageList<T extends MessageHeader>(props: props<T>) {
  return (
      <div>
        <ul>
          {props.messages.map((m, index) => (
            <li key={index} className="mt-4">
              <MessageCard<T> message={m} />
            </li>
          ))}
        </ul>
      </div>
  );
}

export default MessageList;
