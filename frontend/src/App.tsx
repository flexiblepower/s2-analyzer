import { useEffect, useState } from "react";

export default function App() {
    let [connected, set_connected] = useState(false);
    let [messages, set_messages] = useState([] as Message[]);
    let [detail_message, set_detail_message] = useState(null as Message | null);

    useEffect(() => {
        let ws = new WebSocket("ws://localhost:8001/backend/debugger/");
        ws.onopen = () => set_connected(true);
        ws.onclose = () => set_connected(false);
        ws.onmessage = ev => {
            let data = JSON.parse(ev.data);
            if (data.s2_msg_type === "ReceptionStatus") {
                set_messages(messages => {
                    for (let msg of messages) { 
                        if (msg.msg.message_id === data.msg.subject_message_id) {
                            msg.reception_status = data.msg.status;
                        }
                    }

                    return [...messages];
                });
                
            } else {
                set_messages(messages => [...messages, { reception_status: null, ...data }]);
            }
        };
    }, []);

    useEffect(() => {
        console.info("Messages: ", messages);
    }, [messages]);
    
    return <div className="w-full h-full px-8 py-4 relative">
        <div className="flex flex-row justify-between items-start\">
            <MessageList messages={messages} on_click_message={idx => set_detail_message(messages[idx])}/>
            <MessageDetails message={detail_message ?? null} />
        </div>

        <div className="absolute bottom-4 right-4">
            <CoolFrame offset={1} color={connected ? "blue" : "pink"}>
                <div className="font-bold text-blue-800 p-4 text-2xl">{connected ? "Connected" : "Not connected"}</div>
            </CoolFrame>
        </div>
    </div>
}

type Message = {
    msg: {[key: string]: any};

    cem_id: string;
    rm_id: string;
    origin: "RM" | "CEM";
    s2_msg_type: string | null;
    s2_validation_error: string | null;
    timestamp: string;
    reception_status: "OK" | "INVALID_CONTENT" | "INVALID_DATA" | "INVALID_MESSAGE" | "PERMANENT_ERROR" | "TEMPORARY_ERROR" | null;
};

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

function MessageList(props: {messages: Message[], on_click_message: (message_idx: number) => void}) {
    return <div className="w-fit h-fit">
        <div className="font-bold text-5xl text-blue-600 -ml-[2px] mb-4">Messages</div>
        <div className="flex flex-col gap-2 items-start max-h-[80vh] no-scrollbar overflow-y-scroll">
            {props.messages.length === 0 ? <CoolFrame offset={1} color="blue">
                <div className="px-8 bg-white sheared p-2 text-xl">Connect your RM and/or CEM to see their messages here</div>
            </CoolFrame> : <></>}
            {props.messages.map((message, idx) => <CoolFrame offset={1} color={message.origin === "RM" ? "blue" : "teal"} key={idx}>
                <div className="flex flex-row gap-4 text-lg items-center w-full h-full pr-2 cursor-pointer" onClick={() => props.on_click_message(idx)}>
                    <div className={`px-2 text-center py-1 font-bold text-white ${message.origin === "RM" ? "bg-blue-600" : "bg-teal-600"}`}>
                        {message.origin}{" -> "}{origin_inverse(message.origin)}
                    </div>
                    <div className="font-bold w-64">{message_name(message)}</div>
                    <div className="">{message.reception_status === "OK" ? "✓" : message.reception_status === null ? <span className="text-gray-400">...</span> : "✕" }</div>
                    <div>{new Date(message.timestamp).toLocaleString("en-GB")}</div>
                </div>
            </CoolFrame>)}
        </div>
    </div>
}

function MessageDetails(props: {message: Message | null}) {
    let highlight = {
        RM: "text-blue-600",
        CEM: "text-teal-600",
    }[props.message?.origin ?? "RM"];
    let border = {
        RM: "border-blue-600",
        CEM: "border-teal-600",
    }[props.message?.origin ?? "RM"];

    return <div className={`w-[30rem] max-w-[30rem] h-fit transition-opacity ${props.message ? "opacity-100" : "opacity-0"}`}>
        <div className={`font-bold text-5xl transition-colors ${highlight} mb-4`}>Message Details</div>
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

function CoolFrame(props: { children: React.ReactNode, offset: 1 | 2, color: "blue" | "pink" | "teal" }) {
    let color_fg = {
        blue: "bg-blue-600 border-blue-600",
        pink: "bg-pink-600 border-pink-600",
        teal: "bg-teal-600 border-teal-600",
    }[props.color];
    let color_bg = {
        blue: "bg-blue-700 border-blue-700",
        pink: "bg-pink-700 border-pink-700",
        teal: "bg-teal-700 border-teal-700",
    }[props.color];
    let offset = {
        1: "top-1 left-1",
        2: "top-2 left-2"
    }[props.offset];
    let margin = {
        1: "mb-1 mr-1",
        2: "mb-2 mr-2",
    }[props.offset];

    return <div className={`relative ${margin}`}>
        <div className={`bg-white border ${color_fg} transition-colors`}>
            {props.children}
        </div>
        <div className={`absolute ${offset} ${color_bg} w-full h-full transition-colors -z-10`}></div>
    </div>
}