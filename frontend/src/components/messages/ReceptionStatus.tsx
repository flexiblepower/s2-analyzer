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
function ReceptionStatusIcon(props: Props) {
  const [isPopUpVisible, setIsPopUpVisible] = useState(false);

  let imgSrc = Valid;
  let label = "";

  if (typeof props.header.status == "object") {
    label = props.header.status.status;
  } else {
    label = props.header.status.split(" ")[0];
  }

  // Determine the appropriate image source based on the status label
  if (label === "revoked") {
    imgSrc = Revoked;
  } else if (label === "buffered") {
    imgSrc = Buffered;
  } else if (label === "invalid") {
    imgSrc = Error;
  }

  /**
   * Creates a ReceptionStatus object
   * @param text - The status text
   * @returns A ReceptionStatus object
   */
  const createReceptionStatus = (text: string) => {
    return {
      time: props.header.time,
      sender: props.header.sender,
      receiver: props.header.receiver,
      message_type: "ReceptionStatus",
      subject_message_id: props.header.message_id,
      status: text,
    } as ReceptionStatus;
  };

  return (
    <>
      {/* Pop-up component for displaying reception status details */}
      <MessagePopUp<ReceptionStatus>
        trigger={isPopUpVisible}
        setTrigger={setIsPopUpVisible}
        message={
          typeof props.header.status == "object"
            ? props.header.status
            : createReceptionStatus(
                props.header.status.replace("invalid", "Invalid because:\n")
              )
        }
      />
      {/* Status icon with click handler to toggle pop-up visibility */}
      <img
        className="cursor-pointer"
        onClick={() => setIsPopUpVisible(!isPopUpVisible)}
        onKeyDown={() => setIsPopUpVisible(!isPopUpVisible)}
        src={imgSrc}
        alt={label}
        title={label}
        style={{ width: "15px", height: "15px", marginLeft: "0.2em" }}
      />
    </>
  );
}

export default ReceptionStatusIcon;
