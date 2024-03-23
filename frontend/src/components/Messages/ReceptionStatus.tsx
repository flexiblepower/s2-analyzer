import Error from "../../assets/error.png";
import Buffered from "../../assets/buffered.png";
import Revoked from "../../assets/revoked.png";
import Valid from "../../assets/valid.png";

interface props {
  status: string;
}

/**
 * The component for rendering a single ReceptionStatus
 * @returns the ReceptionStatus
 */
function ReceptionStatus(props: props) {
  let imgSrc = Valid;

  if (props.status == "revoked") {
    imgSrc = Revoked
  } else if (props.status == "buffered") {
    imgSrc = Buffered;
  } else if (props.status == "error") {
    imgSrc = Error;
  }

  return <img src={imgSrc} alt={props.status} title={props.status}/>;
}

export default ReceptionStatus;
