import { useState } from "react";
import tnologo from "../../assets/TNO-logo.svg";
import s2logo from "../../assets/s2-analyzer-logo.png";
import Terminal from "./navbar_items/terminal/Terminal";
import OptionsMenu from "./navbar_items/optionsmenu/OptionsMenu";
import {parser} from '../../parser/Parser.ts';
import MessageHeader from "../../models/messageHeader.ts";

interface Props {
  messages: React.Dispatch<React.SetStateAction<MessageHeader[]>>,
  filter:  React.Dispatch<React.SetStateAction<(m: MessageHeader) => boolean>>
}

/**
 * The component for the Navigation Bar
 * @returns the Navigation Bar
 */
function NavBar(props:Props) {
  const [isVisibleTerminal, setIsVisibleTerminal] = useState(false);
  const [isVisibleOptions, setIsVisibleOptions] = useState(false);

  const getFiles = async () => {
    props.messages(await parser.parseLogFile());
  }

  return (
    <>
      <nav className="bg-gradient-to-r from-tno-blue to-blue-600">
        <div className="max-w-max px-1 sm:px-6 lg:px-6">
          <div className="relative flex h-24 items-center justify-between">
            <div className="flex items-center justify-center sm:items-stretch sm:justify-end">
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex space-x-4 mr-10">
                  <img src={tnologo} alt="TNO logo"/>
                </div>
              </div>
              <div className="mx-8 text-white font-semibold font-sans text-3xl cursor-pointer select-none">
                <div onClick={getFiles}>
                  <h1>Load File</h1>
                </div>
              </div>
              <div className="mx-8 text-white font-semibold font-sans text-3xl cursor-pointer select-none">
                <div onClick={() => setIsVisibleTerminal(!isVisibleTerminal)}>
                  <h1>Terminal</h1>
                </div>
              </div>
              <div className="mx-8 text-white font-semibold font-sans text-3xl cursor-pointer select-none">
                <div
                    onClick={() => setIsVisibleOptions(!isVisibleOptions)}
                    className="clickable-heading"
                >
                  <OptionsMenu filter={props.filter}/>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 flex items-center pr-6">
            <img src={s2logo} alt="S2-Analyzer Logo" className="h-24"/>
          </div>
        </div>
      </nav>
      {isVisibleTerminal && <Terminal lines={parser.getLines()}/>}
    </>
  );
}

export default NavBar;
