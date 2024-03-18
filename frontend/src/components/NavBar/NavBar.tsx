import { useState } from "react";
import tnologo from "../../assets/TNO-logo.svg";
import s2logo from "../../assets/s2-analyzer-logo.png";
import Terminal from "./NavBarItems/Terminal/Terminal";

/**
 * The component for the Navigation Bar
 * @returns the Navigation Bar
 */
function NavBar() {
  const [isVisibleTerminal, setIsVisibleTerminal] = useState(false);
  const [isVisibleOptions, setIsVisibleOptions] = useState(false);

  // Changes the visibility of the Terminal Component
  const changeTerminalVisibility = () => {
    setIsVisibleTerminal(!isVisibleTerminal);
  };

  //Changes the visibility of the Options Menu Component
  const changeOptionsVisibility = () => {
    setIsVisibleOptions(!isVisibleOptions);
  };

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
              <div className="mx-8 text-white font-semibold font-sans text-3xl cursor-pointer select-none">
                <div onClick={changeTerminalVisibility}>
                  <h1>Terminal</h1>
                </div>
              </div>
              <div className="mx-8 text-white font-semibold font-sans text-3xl cursor-pointer select-none">
                <div
                  onClick={changeOptionsVisibility}
                  className="clickable-heading"
                >
                  <h1>Options</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 flex items-center pr-6">
            <img src={s2logo} alt="S2-Analyzer Logo" className="h-24" />
          </div>
        </div>
      </nav>
      {isVisibleTerminal && <Terminal></Terminal>}
      {isVisibleOptions}
    </>
  );
}

export default NavBar;
