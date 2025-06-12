export type Session = {
    session_id: string;
    cem_id: string | null;
    rm_id: string | null;
    start_timestamp: string | null
    end_timestamp: string | null
    state: "open" | "closed";
}
