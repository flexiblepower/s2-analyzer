export type Session = {
    session_id: string;
    cem_id: string | null;
    rm_id: string | null;
    state: "open" | "closed";
}