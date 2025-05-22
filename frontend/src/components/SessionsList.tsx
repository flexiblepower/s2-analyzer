import { useEffect, useState } from "react";
import type { Session } from "../types/Session";
import { CoolFrame } from "./CoolFrame";

const HOST = "localhost:8001";

export function SessionSelector(props: {
    on_session_click: (sessionId: string) => void;
    set_show_create_form: (show_create_form: boolean) => void;
}) {
    let [sessions, setSessions] = useState<Session[]>([]);
    let [connected, setConnected] = useState(false);
    const [showClosedSessions, setShowClosedSessions] = useState(false);

    const fetchSessions = async () => {
        try {
            const response = await fetch(`http://${HOST}/backend/connections/`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log(result);
            setSessions(result);
        } catch (err) {
            console.error("Failed to get sessions", err);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        let ws: WebSocket;

        const connectWebSocket = () => {
            let url = `ws://${HOST}/backend/session-updates/`;

            ws = new WebSocket(url);

            ws.onopen = () => setConnected(true);
            ws.onclose = () => setConnected(false);
            ws.onmessage = (ev) => {
                let data = JSON.parse(ev.data);
                console.log(data);
                updateSession(data);
                props.on_session_click(data.session_id);
            };
        };

        connectWebSocket();

        // Cleanup function to close the websocket when currentSessionId changes or component unmounts
        return () => {
            if (ws && ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }
        };
    }, []);

    const updateSession = (newSession: Session) => {
        setSessions((prevSessions) => {
            const existingSessionIndex = prevSessions.findIndex(
                (session) => session.session_id === newSession.session_id,
            );

            let updatedSessions: Session[];

            if (existingSessionIndex !== -1) {
                updatedSessions = [...prevSessions];
                updatedSessions[existingSessionIndex] = {
                    ...updatedSessions[existingSessionIndex],
                    ...newSession,
                };
            } else {
                // If session does not exist, add it
                updatedSessions = [...prevSessions, { ...newSession, state: "open" }];
            }

            // Sort the sessions array
            updatedSessions.sort((a, b) => {
                if (a.state === "open" && b.state !== "open") {
                    return -1; // a comes before b
                }
                if (a.state !== "open" && b.state === "open") {
                    return 1; // b comes before a
                }
                return 0;
            });

            return updatedSessions;
        });
    };

    const openSessions = sessions.filter((session) => session.state === "open");
    const closedSessions = sessions.filter((session) => session.state !== "open");

    return (
        <div className={`w-[40rem] max-w-[40rem] h-fit transition-opacity opacity-100`}>
            <div className="flex justify-between">
                <div className={`font-bold text-4xl transition-colors text-blue-600 mb-4`}>
                    Sessions
                </div>
                <div>
                    <CoolFrame offset={2} color="blue">
                        <button
                            className="px-3 py-2"
                            onClick={() => props.set_show_create_form(true)}
                        >
                            Create Session
                        </button>
                    </CoolFrame>
                </div>
            </div>
            <CoolFrame offset={2} color="blue">
                <div className="text-lg max-h-[40vh] overflow-y-auto no-scrollbar">
                    <div className={`px-8 py-4 flex flex-col gap-2 border-b border-blue-600`}>
                        <h2 className="font-semibold text-xl text-gray-800">Open Sessions</h2>
                        <ol className="list-decimal list-inside text-gray-700">
                            {openSessions.map((session, idx) => (
                                <li key={idx}>
                                    <a
                                        href={`/?session-id=${session.session_id}`}
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent default anchor behavior
                                            props.on_session_click(session.session_id);
                                        }}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {session.session_id}
                                        {session.state === "open" ? (
                                            <span className="font-bold text-teal-600"> (Connected)</span>
                                        ) : (
                                            <span className="font-bold text-pink-600"> (Closed)</span>
                                        )}
                                    </a>
                                </li>
                            ))}
                        </ol>
                        <button
                            className="text-blue-500 hover:underline"
                            onClick={() => setShowClosedSessions(!showClosedSessions)}
                        >
                            {showClosedSessions ? "Hide Closed Session History" : "Show Closed Session History"}
                        </button>

                        {showClosedSessions && (
                            <>
                                <h2 className="font-semibold text-xl text-gray-800 mt-4">
                                    Closed Sessions
                                </h2>
                                <ol className="list-decimal list-inside text-gray-700">
                                    {closedSessions.map((session, idx) => (
                                        <li key={idx}>
                                            <a
                                                href={`/?session-id=${session.session_id}`}
                                                onClick={(e) => {
                                                    e.preventDefault(); // Prevent default anchor behavior
                                                    props.on_session_click(session.session_id);
                                                }}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {session.session_id}
                                                {session.state === "open" ? (
                                                    <span className="font-bold text-teal-600">
                                                        {" "}
                                                        (Connected)
                                                    </span>
                                                ) : (
                                                    <span className="font-bold text-pink-600">
                                                        {" "}
                                                        (Closed)
                                                    </span>
                                                )}
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            </>
                        )}
                    </div>
                </div>
            </CoolFrame>
        </div>
    );
}