import cemBox from "../../assets/cemBox.png";
import rmBox from "../../assets/rmBox.png";

interface Props {
    title: string;
    l_start: number;
    c_start: number;
    c_end: number;
    r_start: number;
}

/**
 * A component to render the DeviceBoxes that surround the exchanged messages.
 *
 * @param props The title, width, height, and line thickness of the boxes.
 */
function DeviceBox(props: Props) {
  let imgSrc = cemBox;

  if (props.title=="RM") {
      imgSrc = rmBox;
  }

  return (
      <>
        <div className={`col-start-${props.l_start} row-start-1 row-end-11 border-l-4 border-black`}></div>
        <div className={`col-start-${props.c_start} col-end-${props.c_end} row-start-${props.r_start} row-end-13`}>
          <img className='h-auto max-w-auto' src={imgSrc} alt={props.title}></img>
          <figcaption className='mt-2 text-lg font-bold text-center text-black'>{props.title}</figcaption>
        </div>
      </>
  );
}

export default DeviceBox;