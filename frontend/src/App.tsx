import { useEffect, useState } from "react";
import type { Message } from "./types/Message";

import { CoolFrame } from "./components/CoolFrame";
import { SessionSelector } from "./components/SessionsList";
import { CreateConnectionForm } from "./components/ConnectionForm";
import React from "react";

const HOST = "localhost:8001"

export default function App() {
    let [connected, set_connected] = useState(false);
    let [messages, set_messages] = useState([] as Message[]);
    let [detail_message, set_detail_message] = useState(null as Message | null);
    let [show_session_form, set_show_session_form] = useState(false as boolean)

    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    useEffect(() => {
        // Parse the initial session ID from the URL on mount
        const urlParams = new URLSearchParams(window.location.search);
        const initialSessionId = urlParams.get("session-id");
        setCurrentSessionId(initialSessionId);
    }, []); // Run once on mount


    useEffect(() => {
        let ws: WebSocket;

        const connectWebSocket = () => {
            let url = `ws://${HOST}/backend/debugger/`;

            if (currentSessionId) {
                url += `?session_id=${currentSessionId}`;
            }

            ws = new WebSocket(url);

            ws.onopen = () => set_connected(true);
            ws.onclose = () => set_connected(false);
            ws.onmessage = (ev) => {
                let data = JSON.parse(ev.data);
                if (data.s2_msg_type === "ReceptionStatus") {
                    set_messages((messages) => {
                        for (let msg of messages) {
                            if (msg.message_type == 'S2' && msg.msg && msg.msg.message_id === data.msg.subject_message_id) {
                                msg.reception_status = data.msg.status;
                            }
                        }

                        return [...messages];
                    });
                } else {
                    set_messages((messages) => [
                        ...messages,
                        { reception_status: null, ...data },
                    ]);
                }
            };
        };

        connectWebSocket();

        // Cleanup function to close the websocket when currentSessionId changes or component unmounts
        return () => {
            if (ws && ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }
        };
    }, [currentSessionId]);

    useEffect(() => {
        console.info("Messages: ", messages);
    }, [messages]);



    function selectSession(session_id: string) {
        if (session_id === currentSessionId) return; // Prevent unnecessary updates

        // Clear message history as it will be filled on re-connection of the WebSocket
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set("session-id", session_id)

        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

        window.history.pushState({}, "", newUrl);

        set_messages([])
        setCurrentSessionId(session_id)
    }

    return <div className="w-full h-full px-8 py-4 relative">
        <div className="flex flex-row justify-between items-start">
            <MessageList messages={messages} current_session_id={currentSessionId} on_click_message={idx => set_detail_message(messages[idx])} />
            <div className="ms-2">
                <SessionSelector
                    on_session_click={selectSession} // Pass the handler
                    set_show_create_form={set_show_session_form}
                ></SessionSelector>
                {show_session_form ? <CreateConnectionForm set_show_create_form={set_show_session_form}
                ></CreateConnectionForm> : ""}
                <MessageDetails message={detail_message ?? null} />
            </div>
        </div>

        <div className="absolute bottom-4 right-4">
            <CoolFrame offset={1} color={connected ? "blue" : "pink"}>
                <div className="font-bold text-blue-800 p-4 text-2xl">{connected ? "Connected" : "Not connected"}</div>
            </CoolFrame>
        </div>
    </div>
}



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
const SessionDivider = (messageType: "SESSION_STARTED" | "SESSION_ENDED") => (
    <div className="w-full flex items-center justify-center py-2">
        <div className="w-1/2 border-b border-gray-400"></div>
        <span className="px-4 text-gray-600">
            {messageType === "SESSION_STARTED" ? "Session Open" : "Session Closed"}
        </span>
        <div className="w-1/2 border-b border-gray-400"></div>
    </div>
);

function MessageList(props: { messages: Message[], current_session_id: string | null, on_click_message: (message_idx: number) => void }) {
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

function MessageDetails(props: { message: Message | null }) {
    let highlight = {
        RM: "text-blue-600",
        CEM: "text-teal-600",
    }[props.message?.origin ?? "RM"];
    let border = {
        RM: "border-blue-600",
        CEM: "border-teal-600",
    }[props.message?.origin ?? "RM"];

    return <div className={`w-[40rem] max-w-[40rem] h-fit transition-opacity mt-5 ${props.message ? "opacity-100" : "opacity-0"}`}>
        <div className={`font-bold text-4xl transition-colors ${highlight} mb-4`}>Message Details</div>

        <CoolFrame offset={2} color={props.message?.origin === "CEM" ? "teal" : "blue"}>
            <div className="text-lg">
                <div className={`px-8 py-4 flex flex-col gap-2 border-b ${border}`}>
                    <div>Sent by: <span className={`font-bold ${highlight}`}>{props.message?.origin}</span></div>
                    <div>Timestamp: {props.message?.timestamp} </div>
                    <div>Reception status: {props.message?.reception_status === "OK" ? <span className={`font-bold ${highlight}`}>OK</span> : props.message?.reception_status === null ? <span className="text-gray-400">not yet received</span> : <span className="font-bold text-red-600">{props.message?.reception_status}</span>}</div>
                </div>
                <div className={`px-8 py-4 border-b ${border}`}>
                    This message {props.message?.s2_validation_error === null ? <span className={`font-bold ${highlight}`}>passed</span> : <span className={`font-bold text-red-600`}>"failed"</span>} validation.
                    {props.message?.s2_validation_error !== null ? <div className="text-base">Reason: {props.message?.s2_validation_error}</div> : <></>}
                </div>
                <div className="px-8 py-4">
                    <div className={`font-bold ${highlight} text-2xl mb-2`}>Message contents</div>
                    <div className="font-mono whitespace-pre-wrap text-base">
                        {JSON.stringify(props.message?.msg, null, 2)}
                    </div>
                </div>
            </div>
        </CoolFrame>
    </div>
}
