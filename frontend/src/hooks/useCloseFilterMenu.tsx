import { useEffect } from "react";

/**
 * A custom hook to handle the closing of the FilterMenu component
 * when the user clicks somewhere outside that component.
 * @param ref Reference.
 * @param onClick A function to handle closing.
 */
function useCloseFilterMenu(
  ref: React.RefObject<HTMLDivElement>,
  onClick: () => void
) {
  useEffect(() => {
    const handleClosing = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClick();
      }
    };
    document.addEventListener("mousedown", handleClosing);
    return () => {
      document.removeEventListener("mousedown", handleClosing);
    };
  }, [ref, onClick]);
}

export default useCloseFilterMenu;
