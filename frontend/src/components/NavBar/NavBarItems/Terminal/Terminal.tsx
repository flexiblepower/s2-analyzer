import { useState } from "react";
import Terminal, { ColorMode, TerminalOutput } from "react-terminal-ui";
import Draggable from "react-draggable";

const TerminalController = (props = {}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const terminalOutput = `21/03/2024, 02:51 pm Handshake Sent {"status": "forwarded", "sender": "RM", "receiver": "CEM", "message_type": "Handshake", "message_id": "edfafsafs3", "role": "CEM", "supported_protocol_versions": null}
  
  \n21/03/2024, 02:51 pm Handshake Response Received {"status": "buffered", "sender": "CEM", "receiver": "RM", "message_type": "HandshakeResponse", "message_id": "edfafsafs3", "selected_protocol_version": "e"}
  
  \n21/03/2024, 02:51 pm Notification {"message_type": "Connection Lost"}
  `;

  return (
    <Draggable handle=".handle">
      <div className="container">
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
          <TerminalOutput>{terminalOutput}</TerminalOutput>
        </Terminal>
      </div>
    </Draggable>
  );
};

export default TerminalController;
