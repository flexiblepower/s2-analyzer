import { useState, useCallback } from "react";

/**
 * A custom hook for toggling a boolean state.
 * @param initialState - The initial state of the toggle (default: false).
 * @returns [state, toggle] - The current state and a function to toggle it.
 */
function useToggle(initialState: boolean = false): [boolean, () => void] {
    const [state, setState] = useState(initialState);

    const toggle = useCallback(() => {
        setState((prev) => !prev);
    }, []);

    return [state, toggle];
}

export default useToggle;
