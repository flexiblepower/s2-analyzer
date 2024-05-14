import MessageHeader from "../../models/messages/messageHeader.ts";
import Draggable from "react-draggable";
import {useEffect, useState} from "react";
import SpecialMessage from "./special/SpecialMessage.tsx";

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
  const [isJSON, setIsJSON] = useState(false);

  useEffect(() => {
        document.addEventListener("keydown", detectKeyDown, true)
      }, []);

  const detectKeyDown = (e: KeyboardEvent) => {
      if (e.key == "x") {
          props.setTrigger(false);
      }
  }

  const handleSpecialValue = (key: keyof T) => {
      if (typeof props.message[key] === 'object') {
          if (key=="status" && typeof props.message.status === "object" && "status" in props.message.status) {
              return props.message.status.status
          } else if ((props.message.message_type == "FRBC.UsageForecast"||props.message.message_type == "PowerForecast" )&&key=="elements" && !isJSON) {
              return "See graph"
          } else if (key == "time") {
              return props.message.time.toLocaleDateString("en-NL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
              })
          }
          return JSON.stringify(props.message[key])
      }
      return props.message[key]?.toString()
  }

  return (
    <Draggable handle={".handle"}>
      <div
        className={`
                 fixed flex justify-center items-center transition-colors z-50
                 ${props.trigger ? "visible" : "invisible"}
                 `}
        style={{position: "fixed", top: "50%", bottom: "50%", left:"50%"}}
      >
          <div
              onClick={(e) => e.stopPropagation()}
              className={`bg-stephanie-color rounded-lg shadow p-6 transition-all
                     ${props.trigger ? "scale-100 opacity-100" : "scale-50 opacity-0"}
                     `}
          >
              <h2 className="handle cursor-all-scroll text-lg font-black text-white justify-center items-center flex">
                  {props.message.message_type}
              </h2>
              <div className="handle font-black">
                  <button
                      className="font-[Arial] absolute top-2 left-2 p-1 rounded-lg text-white bg-stephanie-color hover:text-tno-blue"
                      onClick={()=>setIsJSON(!isJSON)}>
                      {isJSON ? "{J}" : "J"}
                  </button>
                  <button
                      className="text-lg absolute top-2 right-2 p-1 rounded-lg text-white bg-stephanie-color hover:text-tno-blue"
                      onClick={() => props.setTrigger(false)}
                  >
                      x
                  </button>
              </div>
              {isJSON ?
                  <pre className={"text-white whitespace-pre-wrap overflow-auto"} style={{maxWidth: "700px", maxHeight: "700px"}}>
                    {"{\n"+keys.map((k)=>"  \""+k.toString()+"\": "+"\""+handleSpecialValue(k)+"\"").join(",\n")+"\n}"}
                  </pre>
                  :
                  <div>
                  <table className="rounded-lg font-[Calibri] border-2 border-separate border-tno-blue">
                      <thead className="handle cursor-all-scroll text-white border-2 border-tno-blue">
                      <tr className="text-center">
                          <th className="py-3 bg-stephanie-color">Property</th>
                          <th className="py-3 bg-stephanie-color">Value</th>
                      </tr>
                      </thead>
                      <tbody className={"text-white"}>
                      {keys.map((key, index) => (
                          <tr
                              key={index}
                              className="bg-stephanie-color"
                          >
                              <th className="border-2 border-tno-blue">
                                  {key.toString()}
                              </th>
                              <th className={"border-2 border-tno-blue"}>
                                  {handleSpecialValue(key)}
                              </th>
                          </tr>
                      ))}
                      </tbody>
                  </table>
              </div>}
              {!isJSON && <div>
                  <SpecialMessage message={props.message}/>
              </div>}
          </div>
      </div>
    </Draggable>
  );
}

export default MessagePopUp;
