import Error from "../../assets/error.png";
import Buffered from "../../assets/buffered.png";
import Revoked from "../../assets/revoked.png";
import Valid from "../../assets/valid.png";
import ReceptionStatus from "../../models/receptionStatus.ts";
import MessagePopUp from "./MessagePopUp.tsx";
import {useState} from "react";

interface props {
  status: ReceptionStatus | string;
}

/**
 * The component for rendering a single ReceptionStatus
 * @returns the ReceptionStatus
 */
function ReceptionStatusIcon(props: props) {
  const [isPopUpVisible, setIsPopUpVisible] = useState(false);

  let imgSrc = Valid;
  let label = "";

  if (typeof props.status == "object") {
    label = (props.status as ReceptionStatus).status;
  } else {
    label = props.status.split(" ")[0]
  }

  if (label == "revoked") {
    imgSrc = Revoked
  } else if (label == "buffered") {
    imgSrc = Buffered;
  } else if (label == "invalid") {
    imgSrc = Error;
  }

  return (
    <>
    <MessagePopUp<ReceptionStatus>
          trigger={isPopUpVisible}
          setTrigger={setIsPopUpVisible}
          message={typeof props.status == "object" ? props.status : {status: props.status.replace("invalid", "Invalid because:\n")} as ReceptionStatus}
      />
    <img className="cursor-pointer" onClick={()=>setIsPopUpVisible(!isPopUpVisible)} src={imgSrc} alt={label} title={label}/>
    </>);
}

export default ReceptionStatusIcon;
