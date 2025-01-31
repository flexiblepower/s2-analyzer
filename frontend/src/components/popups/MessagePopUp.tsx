import MessageHeader from "../../models/messages/messageHeader.ts";
import Draggable from "react-draggable";
import {useEffect, useRef, useState} from "react";
import SpecialMessage from "./special/SpecialMessage.tsx";
import NestedObjectVisualization from "./special/NestedObjectVisualization.tsx";
import ActuatorDescription from "../../models/dataStructures/frbc/actuatorDescription.ts";
import StorageDescription from "../../models/dataStructures/frbc/storageDescription.ts";

interface Props<T extends MessageHeader> {
    trigger: boolean;
    setTrigger: (arg: boolean) => void;
    message: T;
}

/**
 * The component for rendering a single MessagePopUp
 * @param props - The props containing the trigger, setTrigger function, and the message to be displayed
 * @returns The MessagePopUp component
 */
function MessagePopUp<T extends MessageHeader>(props: Readonly<Props<T>>) {
    const keys = Object.keys(props.message) as (keyof T)[];
    const [isJSON, setIsJSON] = useState(false);
    const [isDraggable, setIsDraggable] = useState(false);
    const draggableNodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.addEventListener("keydown", detectKeyDown, true);
        return () => {
            document.removeEventListener("keydown", detectKeyDown, true);
        };
    }, []);

    const detectKeyDown = (e: KeyboardEvent) => {
        e.stopPropagation();
        switch (e.key) {
            case "x":
                props.setTrigger(false);
                break;
            case "c":
                setIsDraggable((prev) => !prev);
                break;
            default:
                break;
        }
    };

    const handleSpecialValue = (key: keyof T) => {
        if (typeof props.message[key] === "object") {
            if (key === "status" &&
                typeof props.message.status === "object" &&
                "status" in props.message.status) {
                return props.message.status.status;
            } else if (
                (props.message.message_type === "FRBC.UsageForecast" || props.message.message_type === "PowerForecast") &&
                key === "elements" && !isJSON
            ) {
                return "See graph";
            } else if (key === "time") {
                return props.message.time.toLocaleDateString("en-NL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                });
            } else if (!isJSON && key === "actuators" && "actuators" in props.message) {
                return (
                    <NestedObjectVisualization obj={props.message.actuators as ActuatorDescription[]}/>
                );
            } else if (!isJSON && key === "storage" && "storage" in props.message) {
                return (
                    <NestedObjectVisualization obj={props.message.storage as StorageDescription[]}/>
                );
            }
            return JSON.stringify(props.message[key]);
        }
        return props.message[key]?.toString();
    };

    return (
        <Draggable handle={isDraggable ? undefined : ".handle"} nodeRef={draggableNodeRef}>
            <div ref={draggableNodeRef}
                 className={`${isDraggable ? "cursor-all-scroll" : "cursor-auto"} 
                 fixed flex justify-center items-center transition-colors z-50 
                 ${props.trigger ? "visible" : "invisible"}`}
                 style={{ position: "fixed", top: "50%", left: "50%" }}
            >
                <button onClick={(e) => e.stopPropagation()}
                     className={`bg-metallic-gray rounded-lg shadow p-6 transition-all focus:outline-none cursor-[inherit]
                     ${props.trigger ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                >
                    <h2 className="handle cursor-all-scroll text-lg font-black text-white justify-center items-center flex">
                        {props.message.message_type}
                    </h2>
                    <div className="handle font-black">
                        <button className="font-[Arial] absolute top-2 left-2 p-1 rounded-lg text-white bg-metallic-gray hover:text-tno-blue"
                                onClick={() => setIsJSON(!isJSON)}
                        >
                            {isJSON ? "{J}" : "J"}
                        </button>
                        <button className="text-lg absolute top-2 right-2 p-1 rounded-lg text-white bg-metallic-gray hover:text-tno-blue"
                                onClick={() => props.setTrigger(false)}
                        >
                            x
                        </button>
                    </div>
                    {isJSON ? (
                        <pre className="text-white text-left whitespace-pre-wrap overflow-auto" style={{ maxWidth: "700px", maxHeight: "700px" }}>
                            {"{\n" + keys.map((k) => '  "' + k.toString() + '": ' + '"' + handleSpecialValue(k) + '"').join(",\n") + "\n}"}
                        </pre>
                    ) : (
                        <div>
                            <table className="rounded-lg font-[Calibri] border-2 border-separate border-tno-blue">
                                <thead className="handle cursor-all-scroll text-white border-2 border-tno-blue">
                                <tr className="text-center">
                                    <th className="py-3 bg-metallic-gray">Property</th>
                                    <th className="py-3 bg-metallic-gray">Value</th>
                                </tr>
                                </thead>
                                <tbody className="text-white">
                                {keys.map((key, index) => (
                                    <tr key={`${key.toString()}-${index}`} className="bg-metallic-gray">
                                        <th className="border-2 border-tno-blue">
                                            {key.toString()}
                                        </th>
                                        <th className="border-2 border-tno-blue">
                                            {handleSpecialValue(key)}
                                        </th>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!isJSON && (
                        <div>
                            <SpecialMessage message={props.message} />
                        </div>
                    )}
                </button>
            </div>
        </Draggable>
    );
}

export default MessagePopUp;
