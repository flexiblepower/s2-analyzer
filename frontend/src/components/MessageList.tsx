import React from "react";
import { CoolFrame } from "./CoolFrame";
import { Message } from "../types/Message";


export default function MessageList(props: { messages: Message[], current_session_id: string | null, on_click_message: (message_idx: number) => void }) {
    return <div className="w-fit h-fit">
        <div className="mb-4">

            <div className="font-bold text-5xl text-blue-600 -ml-[2px]">Messages</div>
            {
                props.current_session_id ?
                    <div className="text-xl text-gray-500">Session ID: {props.current_session_id} </div>
                    :
                    <div className="text-xl text-gray-500">Select a session to view it's messages.</div>
            }
        </div>
        <div className="flex flex-col gap-2 items-start max-h-[80vh] no-scrollbar overflow-y-scroll">
            {props.messages.length === 0 ? (
                <CoolFrame offset={1} color="blue">
                    <div className="px-8 bg-white sheared p-2 text-xl">
                        Connect your RM and/or CEM to see their messages here
                    </div>
                </CoolFrame>
            ) : null}
            {props.messages.map((message, idx) => {
                if (message.message_type === "SESSION_STARTED" || message.message_type === "SESSION_ENDED") {
                    return <React.Fragment key={idx}>{SessionDivider(message.message_type)}</React.Fragment>;
                }

                if (message.message_type === "S2") {
                    return (
                        <CoolFrame
                            offset={1}
                            color={message.origin === "RM" ? "blue" : "teal"}
                            key={idx}
                        >
                            <button
                                className="flex flex-row gap-4 text-lg items-center w-full h-full pr-2 cursor-pointer"
                                onClick={() => props.on_click_message(idx)}
                            >
                                <div
                                    className={`px-2 text-center py-1 font-bold text-white ${message.origin === "RM" ? "bg-blue-600" : "bg-teal-600"
                                        }`}
                                >
                                    {message.origin} -&gt; {origin_inverse(message.origin)}
                                </div>
                                <div className="font-bold w-64">{message_name(message)}</div>
                                <div className="">
                                    {message.reception_status === "OK"
                                        ? "✓"
                                        : message.reception_status === null
                                            ? <span className="text-gray-400">...</span>
                                            : "✕"}
                                </div>
                                <div>
                                    {new Date(message.timestamp).toLocaleString("en-GB")}
                                </div>
                            </button>
                        </CoolFrame>
                    );
                }

                return null; // Or return an empty fragment: <></>
            })}
        </div>
    </div>
}



const SessionDivider = (messageType: "SESSION_STARTED" | "SESSION_ENDED") => (
    <div className="w-full flex items-center justify-center py-2">
        <div className="w-1/2 border-b border-gray-400"></div>
        <span className="px-4 text-gray-600">
            {messageType === "SESSION_STARTED" ? "Session Open" : "Session Closed"}
        </span>
        <div className="w-1/2 border-b border-gray-400"></div>
    </div>
);

function message_name(message: Message): string {
    return message.s2_msg_type ?? "Unknown Message";
}

function origin_inverse(origin: "RM" | "CEM"): string {
    if (origin === "RM") {
        return "CEM";
    } else {
        return "RM";
    }
}
