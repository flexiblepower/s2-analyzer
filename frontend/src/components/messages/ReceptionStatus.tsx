import Error from "../../assets/error.png";
import Buffered from "../../assets/buffered.png";
import Revoked from "../../assets/revoked.png";
import Valid from "../../assets/valid.png";
import ReceptionStatus from "../../models/dataStructures/receptionStatus.ts";
import MessagePopUp from "../popups/MessagePopUp.tsx";
import { useState } from "react";
import MessageHeader from "../../models/messages/messageHeader.ts";

interface Props {
    header: MessageHeader;
}

/**
 * The component for rendering a single ReceptionStatus
 * @param props - The properties for the ReceptionStatusIcon component, including a message header
 * @returns The ReceptionStatusIcon component
 */
function ReceptionStatusIcon({ header }: Readonly<Props>) {
    const [isPopUpVisible, setIsPopUpVisible] = useState(false);

    // Mapping status labels to image sources
    const statusMap: { [key: string]: string } = {
        revoked: Revoked,
        buffered: Buffered,
        invalid: Error,
    };

    const statusLabel = typeof header.status === "object" ? header.status.status : header.status.split(" ")[0];
    const imgSrc = statusMap[statusLabel] || Valid;

    // Create the ReceptionStatus object
    const createReceptionStatus = (text: string) => ({
        time: header.time,
        sender: header.sender,
        receiver: header.receiver,
        message_type: "ReceptionStatus",
        subject_message_id: header.message_id,
        status: text,
    } as ReceptionStatus);

    return (
        <>
            <MessagePopUp<ReceptionStatus>
                trigger={isPopUpVisible}
                setTrigger={setIsPopUpVisible}
                message={typeof header.status === "object"
                        ? header.status : createReceptionStatus(header.status.replace("invalid", "Invalid because:\n"))}
            />
            <img className="cursor-pointer"
                 onClick={() => setIsPopUpVisible((prev) => !prev)}
                 onKeyDown={() => setIsPopUpVisible((prev) => !prev)}
                 src={imgSrc}
                 alt={statusLabel}
                 title={statusLabel}
                 style={{ width: "15px", height: "15px", marginLeft: "0.2em" }}
            />
        </>
    );
}

export default ReceptionStatusIcon;
