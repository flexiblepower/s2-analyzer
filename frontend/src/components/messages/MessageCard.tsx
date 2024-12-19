import { useState } from "react";
import ArrowL from "../../assets/arrowL.png";
import ArrowR from "../../assets/arrowR.png";
import Line from "../../assets/line.png";
import MessagePopUp from "../popups/MessagePopUp.tsx";
import MessageHeader from "../../models/messages/messageHeader.ts";
import ReceptionStatusIcon from "./ReceptionStatus.tsx";

interface Props<T extends MessageHeader> {
    message: T;
}

/**
 * The component for rendering a single MessageHeader
 * @param props - The properties for the MessageCard component, including a message of type T
 * @returns The MessageCard component
 */
function MessageCard<T extends MessageHeader>({ message }: Props<T>) {
    const [visiblePopups, setVisiblePopups] = useState<T[]>([]);

    const getArrowImage = () => {
        if (message.message_id == null) {
            return Line;
        }
        return message.sender?.split(" ")[0] === "RM" ? ArrowL : ArrowR;
    };

    const togglePopUp = (msg: T) => {
        setVisiblePopups((prev) =>
            prev.includes(msg) ? prev.filter((m) => m !== msg) : [...prev, msg]
        );
    };

    return (
        <>
            {/* Pop-up components for displaying message details */}
            {visiblePopups.map((msg) => (
                <MessagePopUp<T>
                    key={msg.message_id}
                    trigger={true}
                    setTrigger={() => setVisiblePopups((prev) => prev.filter((m) => m !== msg))}
                    message={msg}
                />
            ))}
            <div className="justify-center flex">
                <div>
                    <table className={`items-center justify-center flex ${message.message_id ? "text-tno-blue" : "text-good-red"}`}>
                        <tbody>
                        <tr>
                            <th>
                                <h3 className="cursor-pointer" onClick={() => togglePopUp(message)} onKeyDown={() => togglePopUp(message)}>
                                    {message.message_type}
                                </h3>
                            </th>
                            {message.status && (
                                <th>
                                    <ReceptionStatusIcon header={message}/>
                                </th>
                            )}
                        </tr>
                        </tbody>
                    </table>
                    <img
                        src={getArrowImage()}
                        alt={message.sender?.toString()}
                        title={message.sender?.toString()}
                    />
                    <p
                        className={`${message.sender?.split(" ")[0] === "RM" ? "text-right" : "text-left"} text-xs font-semibold`}
                        style={{ marginRight: "0.2em", marginLeft: "0.5em" }}
                    >
                        {message.time.toLocaleDateString("en-NL", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                        })}
                    </p>
                </div>
            </div>
        </>
    );
}

export default MessageCard;
