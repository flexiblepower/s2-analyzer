import React, {useEffect} from "react";

/**
 * A custom hook to handle the closing of the FilterMenu component when the user clicks somewhere outside that component
 * @param ref Reference to the FilterMenu component
 * @param onClick A function to handle closing the FilterMenu
 */
function useCloseFilterMenu(
    ref: React.RefObject<HTMLDivElement>, // Reference to the FilterMenu component
    onClick: () => void // Function to handle closing the FilterMenu
) {
    useEffect(() => {
        /**
         * Function to handle the closing logic
         * Checks if the click was outside the referenced component, and if so, calls the onClick handler
         * @param event The mouse event triggered by clicking
         */
        const handleClosing = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClick();
            }
        };

        // Attach the event listener to the document
        document.addEventListener("mousedown", handleClosing);

        return () => {
            document.removeEventListener("mousedown", handleClosing);
        };
    }, [ref, onClick]);
}

export default useCloseFilterMenu;
