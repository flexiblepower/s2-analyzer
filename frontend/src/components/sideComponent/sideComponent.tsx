import { useState, useEffect, useRef } from "react";

const [minWidth, maxWidth, defaultWidth] = [200, window.innerWidth/2, 350];

function Sidebar() {
  const [width, setWidth] = useState(defaultWidth);
  const isResized = useRef(false);

  useEffect(() => {
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

    window.addEventListener("mouseup", () => {
      isResized.current = false;
    });
  }, []);

  return (
      <div className="flex absolute transition-colors">

        <div style={{width: `${width / 16}rem`, height: window.innerHeight*0.81}} className="bg-base-gray">
          Sidebar
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