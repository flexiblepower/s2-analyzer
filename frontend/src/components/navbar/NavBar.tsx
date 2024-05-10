import { useState, useEffect } from "react";
import tnologo from "../../assets/TNO-logo.svg";
import s2logo from "../../assets/s2-analyzer-logo.png";
import Terminal from "./navbar_items/terminal/Terminal";
import OptionsMenu from "./navbar_items/optionsmenu/OptionsMenu";
import { parser } from "../../parser/Parser";
import MessageHeader from "../../models/messages/messageHeader";
import { Filters } from "../../models/dataStructures/filters";

interface NavBarProps {
  messages: React.Dispatch<React.SetStateAction<MessageHeader[]>>;
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

/**
 * The component for the Navigation Bar
 * @returns the Navigation Bar
 */
function NavBar({ messages, filters, onFilterChange }: NavBarProps) {
  const [isVisibleTerminal, setIsVisibleTerminal] = useState(false);
  const [isVisibleOptions, setIsVisibleOptions] = useState(false);

  const fetchMessages = async () => {
    try {
      const newMessages = await parser.parseLogFile();
      messages(newMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  /**
   * Somewhat of a hack to get new messages, instead of the old loadfile button. 
   * Probably should move this!
   */
  useEffect(() => {
    // Start polling for new messages every 1 seconds
    const interval = setInterval(fetchMessages, 1000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <>
      <nav className="bg-gradient-to-r from-tno-blue to-blue-600">
        <div className="max-w-max px-1 sm:px-6 lg:px-6">
          <div className="relative flex h-24 items-center justify-between">
            <div className="flex items-center justify-center sm:items-stretch sm:justify-end">
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex space-x-4 mr-10">
                  <img src={tnologo} alt="TNO logo" />
                </div>
              </div>
              <div className="mx-8 text-white font-semibold font-sans text-3xl cursor-pointer select-none hover:scale-110">
                <h1>Load File</h1>
              </div>
              <div className="mx-8 text-white font-semibold font-sans text-3xl cursor-pointer select-none hover:scale-110">
                <div onClick={() => setIsVisibleTerminal(!isVisibleTerminal)}>
                  <h1>Terminal</h1>
                </div>
              </div>
              <div className="mx-8 text-white font-semibold font-sans text-3xl cursor-pointer select-none hover:scale-110">
                <div
                  onClick={() => setIsVisibleOptions(!isVisibleOptions)}
                  className="clickable-heading"
                >
                  <OptionsMenu
                    filters={filters}
                    onFilterChange={onFilterChange}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 flex items-center pr-6">
            <img src={s2logo} alt="S2-Analyzer Logo" className="h-24" />
          </div>
        </div>
      </nav>
      {isVisibleTerminal && <Terminal lines={parser.getLines()} />}
    </>
  );
}

export default NavBar;
