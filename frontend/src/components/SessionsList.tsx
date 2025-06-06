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
    const [historyFetched, setHistoryFetched] = useState(false);

    const fetchSessions = async () => {
        try {
            const response = await fetch(`http://${HOST}/backend/connections/`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setSessions(result);
        } catch (err) {
            console.error("Failed to get sessions", err);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        if (showClosedSessions && !historyFetched) {
            fetchSessions(); // Re-fetch to get the closed sessions
            setHistoryFetched(true);
        }
    }, [showClosedSessions, historyFetched]);

    useEffect(() => {
        let ws: WebSocket;

        const connectWebSocket = () => {
            let url = `ws://${HOST}/backend/session-updates/`;

            ws = new WebSocket(url);

            ws.onopen = () => setConnected(true);
            ws.onclose = () => setConnected(false);
            ws.onmessage = (ev) => {
                let data = JSON.parse(ev.data);
                updateSession(data);
                props.on_session_click(data.session_id);
            };
        };

        connectWebSocket();

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
                updatedSessions = [...prevSessions, { ...newSession, state: "open" }];
            }

            updatedSessions.sort((a, b) => {
                if (a.state === "open" && b.state !== "open") {
                    return -1;
                }
                if (a.state !== "open" && b.state === "open") {
                    return 1;
                }
                return 0;
            });

            return updatedSessions;
        });
    };

    const openSessions = sessions.filter((session) => session.state === "open");
    const closedSessions = sessions.filter((session) => session.state !== "open");

    const renderSessionTable = (sessionsToRender: Session[]) => (
        <table className="min-w-full">
            <thead className="bg-gray-100">
                <tr>
                    <th className="px-4 py-2 font-medium text-gray-700 text-left">
                        #
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-700 text-left">
                        CEM ID
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-700 text-left">
                        RM ID
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-700 text-left">
                        End Timestamp
                    </th>
                </tr>
            </thead>
            <tbody>
                {sessionsToRender.map((session, index) => (
                    <tr
                        key={session.session_id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => props.on_session_click(session.session_id)}
                    >
                        <td className="px-4 py-2 text-gray-600">{index + 1}</td>
                        <td className="px-4 py-2 text-gray-600">
                            {session.cem_id || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                            {session.rm_id || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                            {session.end_timestamp || "N/A"}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

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
                <div className="text-lg max-h-[40vh] overflow-y-auto no-scrollbar p-4">
                    <h2 className="font-semibold text-xl text-gray-800">Open Sessions</h2>
                    {renderSessionTable(openSessions)}
                    <button
                        className="text-blue-500 hover:underline mt-2"
                        onClick={() => setShowClosedSessions(!showClosedSessions)}
                    >
                        {showClosedSessions
                            ? "Hide Closed Session History"
                            : "Show Closed Session History"}
                    </button>

                    {showClosedSessions && (
                        <>
                            <h2 className="font-semibold text-xl text-gray-800 mt-4">
                                Closed Sessions
                            </h2>
                            {renderSessionTable(closedSessions)}
                        </>
                    )}
                </div>
            </CoolFrame>
        </div>
    );
}