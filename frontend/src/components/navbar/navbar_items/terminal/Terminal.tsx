import { useState } from "react";
import Terminal, { ColorMode, TerminalOutput } from "react-terminal-ui";
import Draggable from "react-draggable";

interface Props {
    lines: string
}

function TerminalController(props: Props) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
      return null;
  }

  return (
    <Draggable handle=".handle">
      <div className="container fixed">
        <div
          className="handle"
          style={{ cursor: "move", backgroundColor: "#eee", padding: "14px" }}
        >
          <button
            onClick={() => setIsVisible(false)}
            style={{
              position: "absolute",
              top:"5px",
              right: "5px",
              float: "right",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <Terminal
          name="Terminal"
          colorMode={ColorMode.Dark}
        >
          <TerminalOutput>{props.lines}</TerminalOutput>
        </Terminal>
      </div>
    </Draggable>
  );
}

export default TerminalController;
