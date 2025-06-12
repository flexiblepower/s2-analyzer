import { useEffect, useState } from "react";
import type { Message } from "./types/Message";

import { CoolFrame } from "./components/CoolFrame";
import { SessionSelector } from "./components/SessionsList";
import { CreateConnectionForm } from "./components/ConnectionForm";
import MessageDetails from "./components/MessageDetails";
import MessageList from "./components/MessageList";

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


