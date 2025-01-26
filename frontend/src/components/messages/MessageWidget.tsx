import cemBox from "../../assets/cemBox.png";
import rmBox from "../../assets/rmBox.png";
import MessageCard from "./MessageCard.tsx";
import MessageHeader from "../../models/messages/messageHeader";

interface MessageWidgetProps<T extends MessageHeader> {
    messages: T[];
}

/**
 * The component for rendering the MessageWidget
 * @param props - The properties for the MessageWidget component, including an array of searched messages of type T
 * @returns The MessageWidget component
 */
function MessageWidget<T extends MessageHeader>({ messages }: Readonly<MessageWidgetProps<T>>) {
    return (
        <div className="max-w-xl h-5/6 rounded-xl shadow-[0_1px_30px_1px_rgba(0,0,0,0.3)] grid grid-cols-12 grid-rows-12">
            {/* Left Box (CEM) */}
            <div className="col-start-2 col-end-4 row-start-11">
                <img className="h-auto max-w-auto" src={cemBox} alt="CEM Box" />
                <figcaption className="mt-2 text-lg font-semibold text-center text-black">CEM</figcaption>
            </div>

            {/* Right Box (RM) */}
            <div className="col-start-10 col-end-12 row-start-11">
                <img className="h-auto max-w-auto" src={rmBox} alt="RM Box" />
                <figcaption className="mt-2 text-lg font-semibold text-center text-black">RM</figcaption>
            </div>

            {/* Vertical Separators */}
            <div className="col-start-3 row-start-2 row-end-11 border-l-4 border-black"></div>
            <div className="col-start-11 row-start-2 row-end-11 border-l-4 border-black"></div>

            {/* Messages Section */}
            <div className="col-start-3 col-end-11 row-start-2 row-end-11 overflow-auto">
                <ul>
                    {messages.map((message, index) => (
                        <li key={index} className="mt-4">
                            <MessageCard<T> message={message} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default MessageWidget;
