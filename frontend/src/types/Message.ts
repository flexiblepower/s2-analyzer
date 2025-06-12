
export type MessageType = "S2" | "SESSION_STARTED" | "SESSION_ENDED" | "MSG_INJECTED";

export type ValidationErrors = {
    msg: string
    errors: { [key: string]: string[] }[] | null;
}

export type Message = {
    msg: { [key: string]: any };

    session_id: string; // UUID
    cem_id: string;
    rm_id: string;

    message_type: MessageType

    origin: "RM" | "CEM";
    s2_msg_type: string | null;
    s2_validation_error: ValidationErrors| null;
    timestamp: string;

    reception_status: "OK" | "INVALID_CONTENT" | "INVALID_DATA" | "INVALID_MESSAGE" | "PERMANENT_ERROR" | "TEMPORARY_ERROR" | null;
};