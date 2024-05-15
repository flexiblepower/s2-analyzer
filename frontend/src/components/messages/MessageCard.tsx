import { useState } from "react";
import ArrowL from "../../assets/arrowL.png";
import ArrowR from "../../assets/arrowR.png"
import Line from "../../assets/line.png";
import MessagePopUp from "../popups/MessagePopUp.tsx";
import MessageHeader from "../../models/messages/messageHeader.ts";
import ReceptionStatusIcon from "./ReceptionStatus.tsx";

interface props<T extends MessageHeader> {
  message: T;
}

/**
 * The component for rendering a single MessageHeader
 * @returns the MessageCard
 */
function MessageCard<T extends MessageHeader>(props: props<T>) {
  const [isPopUpVisible, setIsPopUpVisible] = useState(false);

  return (
      <>
        <MessagePopUp<T>
            trigger={isPopUpVisible}
            setTrigger={setIsPopUpVisible}
            message={props.message}
        />
        <div className={"justify-center flex"}>
          <div>
            <table
                className={`'items-center justify-center flex 
                          ${props.message.message_id != null ? "text-tno-blue" : "text-good-red"}`}
            >
              <tbody>
              <tr>
                <th>
                  <h3
                      className="cursor-pointer"
                      onClick={() => setIsPopUpVisible(!isPopUpVisible)}
                  >
                    {props.message.message_type}
                  </h3>
                </th>
                {props.message.status && (
                    <th>
                      <ReceptionStatusIcon header={props.message} />
                    </th>
                )}
              </tr>
              </tbody>
            </table>
            <img src={props.message.message_id != null ? props.message.sender?.split(' ')[0] == "RM" ? ArrowL : ArrowR : Line} alt={props.message.sender?.toString()}/>
            <p
                className={`${props.message.sender?.split(' ')[0] == "RM" ? "text-right" : "text-left"} text-xs`}
                style={{marginRight: "0.2em", marginLeft:"0.5em"}}
            >
              {props.message.time.toLocaleDateString("en-NL", {
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
