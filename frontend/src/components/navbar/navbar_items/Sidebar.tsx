import { useState, useEffect, useRef } from "react";
import { parser } from "../../../parser/Parser.ts";

const [minWidth, maxWidth, defaultWidth] = [
  200,
  window.innerWidth / 2,
  window.innerWidth / 4,
];

/**
 * Sidebar component that displays parser errors and allows resizing
 * @returns The Sidebar component
 */
function Sidebar() {
  const [width, setWidth] = useState(defaultWidth);
  const isResized = useRef(false);

  useEffect(() => {
    // Handle mousemove event to resize the sidebar
    window.addEventListener("mousemove", (e) => {
      if (!isResized.current) {
        return;
      }

      setWidth((previousWidth) => {
        const newWidth = previousWidth + e.movementX / 3;

        const isWidthInRange = newWidth >= minWidth && newWidth <= maxWidth;

        return isWidthInRange ? newWidth : previousWidth;
      });
    });

    // Handle mouseup event to stop resizing
    window.addEventListener("mouseup", () => {
      isResized.current = false;
    });
  }, []);

  return (
    <div className="overflow-auto flex absolute transition-colors">
      <div
        style={{ width: `${width / 16}rem`, height: window.innerHeight * 0.86 }}
        className="border-tno-blue border-r bg-base-gray"
      >
        <h1 className={"text-lg text-white"}>All errors:</h1>
        {parser.getErrors().length != 0 &&
          parser.getErrors().map((s: string, index) => {
            return (
              <pre
                key={index}
                className={"text-white overflow-auto bg-base-gray"}
                style={{ maxWidth: width, overflowX: "hidden" }}
              >
                {s}
              </pre>
            );
          })}
        {parser.getErrors().length == 0 && (
          <pre className={"text-white"}>None.</pre>
        )}
      </div>

      <div
        className="w-2 cursor-col-resize"
        onMouseDown={() => {
          isResized.current = true;
        }}
      />
    </div>
  );
}

export default Sidebar;
