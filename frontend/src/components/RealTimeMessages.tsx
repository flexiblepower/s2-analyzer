import MessageWidget from './messages/MessageWidget.tsx';
import MessageTable from './messages/MessageTable.tsx';
import MessageHeader from '../models/messages/messageHeader.ts';
import TerminalController from "./terminal/Terminal.tsx";

interface RealTimeMessagesProps {
    isWidgetView: boolean;
    searchedMessages: MessageHeader[];
    alignment: string;
    parserLines: string;
}

const RealTimeMessages = ({
                              isWidgetView,
                              searchedMessages,
                              alignment,
                              parserLines}:RealTimeMessagesProps) => {
    return (
        <>
            <div className="col-start-1 col-end-13 row-start-1 row-end-2 text-center text-white">
                Real-Time Data
            </div>
            <div className={`col-start-1 col-end-13 row-start-1 row-end-12 flex items-center ${alignment}`}>
                {isWidgetView ? (
                    <MessageWidget<MessageHeader> messages={searchedMessages} />
                ) : (
                    <MessageTable messages={searchedMessages} />
                )}
            </div>
            <div className="col-start-1 col-end-13 row-start-12 row-end-13 z-40">
                <TerminalController parserLines={parserLines} />
            </div>
        </>
    );
};

export default RealTimeMessages;
