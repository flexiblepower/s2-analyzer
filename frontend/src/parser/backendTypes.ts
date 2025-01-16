interface MessageValidationDetails {
    msg: string;
    errors: Array<{
        type: string;
        loc: string[];
        msg: string;
        input: Record<string, unknown>;
        url: string;
    }> | null;
}

export default interface BackendMessage {
    cem_id: string;
    rm_id: string;
    origin: string;
    msg: {
        message_id: string;
        message_type: string;
        [key: string]: unknown; // Allow extra fields
    };
    s2_msg: string | null;
    s2_msg_type: string | null;
    s2_validation_error: MessageValidationDetails | null;
    timestamp: string;
}