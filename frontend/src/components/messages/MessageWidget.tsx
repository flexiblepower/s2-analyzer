import cemBox from "../../assets/cemBox.png";
import rmBox from "../../assets/rmBox.png";
import MessageList from "../messages/MessageList";
import MessageHeader from "../../models/messages/messageHeader";

interface props<T extends MessageHeader> {
    searchedMessages: T[];
}

/**
 * The component for rendering the MessageWidget
 * @param props - The properties for the MessageWidget component, including an array of searched messages of type T
 * @returns The MessageWidget component
 */
function MessageWidget<T extends MessageHeader>(props: props<T>) {
    return (
        <div className="max-w-xl h-5/6 rounded-xl shadow-[0_1px_30px_1px_rgba(0,0,0,0.3)] grid grid-cols-12 grid-rows-12">
            <div className="col-start-2 col-end-4 row-start-11">
                {/* Image and caption for CEM */}
                <img className="h-auto max-w-auto" src={cemBox} alt="image"></img>
                <figcaption className="mt-2 text-lg font-semibold text-center text-black">
                    {" "}
                    CEM
                </figcaption>
            </div>

            <div className="col-start-10 col-end-12 row-start-11">
                {/* Image and caption for RM */}
                <img className="h-auto max-w-auto" src={rmBox} alt="image"></img>
                <figcaption className="mt-2 text-lg font-semibold text-center text-black">
                    {" "}
                    RM
                </figcaption>
            </div>

            <div className="col-start-3 row-start-2 row-end-11 border-l-4 border-black"></div>
            <div className="col-start-11 row-start-2 row-end-11 border-l-4 border-black"></div>

            <div
                className="col-start-3 col-end-11 row-start-2 row-end-11"
                style={{overflow: "auto"}}
            >
                {/* Render the MessageList component with searchedMessages */}
                <MessageList<MessageHeader>
                    messages={props.searchedMessages}
                ></MessageList>
            </div>
        </div>
    );
}

export default MessageWidget;
