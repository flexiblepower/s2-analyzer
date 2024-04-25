import Terminal, { ColorMode, TerminalOutput } from "react-terminal-ui";
import {parser} from "../../parser/Parser.ts";

/**
 * The component for the Terminal.
 * @param lines The lines to show in the terminal component.
 * @returns the draggable Terminal component.
 */
function TerminalController() {

  return (
      <div>
          <div
              style={{maxWidth: window.innerWidth-20}}
          >
              <Terminal name="Terminal" colorMode={ColorMode.Dark}>
                      <TerminalOutput>{parser.getLines()}</TerminalOutput>
              </Terminal>
          </div>
      </div>
  );
}

export default TerminalController;
