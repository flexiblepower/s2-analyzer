import { useEffect, useState } from "react";
import type { Session } from "../types/Session";
import { CoolFrame } from "./CoolFrame";

const HOST = "localhost:8001";

export function SessionSelector(props: {
    on_session_click: (session_id: string) => void;
    set_show_create_form: (show_create_form: boolean) => void;
}) {
    let [sessions, set_sessions] = useState<Session[]>([]);
    let [connected, set_connected] = useState(false);
    const [show_closed_sessions, set_show_closed_sessions] = useState(false);
    const [history_fetched, set_history_fetched] = useState(false);

    const fetch_sessions = async () => {
        try {
            const response = await fetch(`http://${HOST}/backend/connections/`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result: Session[] = await response.json();
            set_sessions(result);
        } catch (err) {
            console.error("Failed to get sessions", err);
        }
    };

    useEffect(() => {
        fetch_sessions();
    }, []);

    useEffect(() => {
        if (show_closed_sessions && !history_fetched) {
            fetch_sessions(); // Re-fetch to get the closed sessions
            set_history_fetched(true);
        }
    }, [show_closed_sessions, history_fetched]);

    useEffect(() => {
        let ws: WebSocket;

        const connect_websocket = () => {
            let url = `ws://${HOST}/backend/session-updates/`;

            ws = new WebSocket(url);

            ws.onopen = () => set_connected(true);
            ws.onclose = () => set_connected(false);
            ws.onmessage = (ev) => {
                let data = JSON.parse(ev.data);
                const isNew: boolean = update_session(data);
                if (isNew) {

                    props.on_session_click(data.session_id);
                }
            };
        };

        connect_websocket();

        return () => {
            if (ws && ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }
        };
    }, []);

    const update_session = (newSession: Session) => {
        let isNew = false;
        set_sessions((prevSessions) => {
            const existingSessionIndex = prevSessions.findIndex(
                (session) => session.session_id === newSession.session_id,
            );
            if (existingSessionIndex === -1) {
                isNew = true;
            }

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
        return isNew;
    };

    const open_sessions = sessions.filter((session) => session.state === "open");
    const closed_sessions = sessions.filter((session) => session.state !== "open");

    const render_session_table = (sessions_to_render: Session[]) => (
        <>
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
                    {sessions_to_render.length > 0 ? sessions_to_render.map((session, index) => (
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
                    )) : <></>}
                </tbody>
            </table>
            {sessions_to_render.length == 0 ? <div className="text-center py-2 px-4 text-gray-400 min-w-full col-span-4">No sessions</div> : <></>}
        </>
    );

    return (
        <div className={`w-160 max-w-160 mb-12 h-fit transition-opacity opacity-100`}>
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
                    {/* <h2 className="font-semibold text-xl text-gray-800">Open Sessions</h2> */}
                    {render_session_table(open_sessions)}
                    <button
                        className="text-blue-500 hover:underline mt-2"
                        onClick={() => set_show_closed_sessions(!show_closed_sessions)}
                    >
                        {show_closed_sessions
                            ? "Hide Closed Session History"
                            : "Show Closed Session History"}
                    </button>

                    {show_closed_sessions && (
                        <>
                            <h2 className="font-semibold text-xl mb-2 text-gray-800 mt-4">
                                Closed Sessions
                            </h2>
                            {render_session_table(closed_sessions)}
                        </>
                    )}
                </div>
            </CoolFrame>
        </div>
    );
}