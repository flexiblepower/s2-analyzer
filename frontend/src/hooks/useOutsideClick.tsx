import { useEffect, RefObject } from 'react';

/**
 * Custom hook to handle clicks outside multiple referenced elements.
 *
 * @param refs - Array of React references to the elements to detect outside clicks on.
 * @param handlers - Array of functions to call when a click outside each corresponding referenced element is detected.
 */
const useOutsideClick = (refs: RefObject<HTMLElement>[], handlers: (() => void)[]) => {
    useEffect(() => {
        /**
         * Handles the click event and checks if it occurred outside any of the referenced elements.
         *
         * @param event - The mouse event.
         */
        const handleClickOutside = (event: MouseEvent) => {
            refs.forEach((ref, index) => {
                if (ref.current && !ref.current.contains(event.target as Node)) {
                    handlers[index](); // Call the handler function if click is outside the referenced element
                }
            });
        };

        // Add the event listener for mousedown events
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // Remove the event listener when the component is unmounted or dependencies change
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [refs, handlers]); // Dependency array to re-run the effect when refs or handlers change
};

export default useOutsideClick;
