import { useState } from "react";
import ArrowL from "../../assets/ArrowL.png";
import ArrowR from "../../assets/ArrowR.png";
import Line from "../../assets/line.png";
import MessagePopUp from "./MessagePopUp.tsx";
import MessageHeader from "../../models/messageHeader.ts";
import ReceptionStatus from "./ReceptionStatus.tsx";

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
                          ${props.message.message_id != null ? "text-blue-700" : "text-red-500"}`}
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
                    <ReceptionStatus status={props.message.status} />
                  </th>
                )}
              </tr>
            </tbody>
          </table>
          <img src={props.message.message_id != null ? props.message.sender == "RM" ? ArrowL : ArrowR : Line} alt={props.message.sender?.toString()}/>
          <p
            className={`${
              props.message.sender == "RM" ? "text-right" : "text-left"
            } text-xs`}
          >
            {props.message.time.toLocaleDateString("en-NL", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        </div>
      </div>
    </>
  );
}

export default MessageCard;
