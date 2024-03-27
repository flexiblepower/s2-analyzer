import MessageHeader from "../../models/messageHeader.ts";
import Draggable from "react-draggable";
import PowerForecastGraph from "./PowerForecastGraph.tsx";
import PowerForecastElement from "../../models/dataStructures/powerForecastElement.ts";
import UsageForecastGraph from "./UsageForecastGraph.tsx";
import UsageForecastElement from "../../models/dataStructures/frbc/usageForecastElement.ts";

interface props<T extends MessageHeader> {
  trigger: boolean;
  setTrigger: (arg: boolean) => void;
  message: T;
}

/**
 * The component for rendering a single MessagePopUp
 * @returns the MessagePopUp
 */
function MessagePopUp<T extends MessageHeader>(props: props<T>) {
  const keys = Object.keys(props.message) as (keyof T)[];

  const handleSpecialMessage = () => {
      if (props.message.message_type == "PowerForecast") {
          return <PowerForecastGraph data={props.message.elements as PowerForecastElement[]} start={props.message.start_time as Date}/>
      } else if (props.message.message_type == "UsageForecast") {
          return <UsageForecastGraph data={props.message.elements as UsageForecastElement[]} start={props.message.start_time as Date}/>
      }
      return <></>;
  }

  const handleSpecialValue = (key: keyof T) => {
      if (typeof props.message[key] === 'object') {
          if (key=="status") {
              return props.message.status.status
          } else if (key=="elements") {
              return "See graph below"
          }
          return JSON.stringify(props.message[key])
      }
      return props.message[key]?.toString()
  }

  return (
    <Draggable>
      <div
        className={`
                 fixed flex justify-center items-center transition-colors
                 ${props.trigger ? "visible" : "invisible"}
                 `}
        style={{position: "fixed", top: "50%", bottom: "50%", left:"50%"}}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`bg-white rounded-xl shadow p-6 transition-all
                     ${props.trigger ? "scale-100 opacity-100" : "scale-50 opacity-0"}
                     `}
        >
          <h2 className="text-lg font-black text-gray-800 justify-center items-center flex">
            {props.message.message_type}
          </h2>
          <button
            className="absolute top-2 right-2 p-1 rounded-lg text-gray-400 bg-white hover:bg-gray-50 hover:text-gray-600"
            onClick={() => props.setTrigger(false)}
          >
            x
          </button>
          <div className="props-list">
            <table className="font-[Calibri] border-2 border-tno-blue">
              <thead className="text-white border-2 border-tno-blue">
                <tr className="text-center">
                  <th className="py-3 bg-tno-blue">Property</th>
                  <th className="py-3 bg-tno-blue">Value</th>
                </tr>
              </thead>
              <tbody className={"text-black"}>
                {keys.map((key, index) => (
                  <tr
                    key={index}
                    className={`${index % 2 == 0 ? "bg-blue-500" : "bg-blue-300"}`}
                  >
                    <th className="border-2 border-blue-900">
                      {key.toString()}
                    </th>
                    <th className={"border-2 border-blue-900"}>
                        {handleSpecialValue(key)}
                    </th>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            <div>
                {handleSpecialMessage()}
            </div>
        </div>
      </div>
    </Draggable>
  );
}

export default MessagePopUp;
