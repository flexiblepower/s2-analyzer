import React, { useState } from "react";
import s2AnalyzerLogo from "../../assets/s2-analyzer-logo.png";
import MessageHeader from "../../models/messages/messageHeader.ts";
import { Filters } from "../../models/dataStructures/filters.ts";
import { parser } from "../../parser/Parser.ts";
import FilterMenu from "./navbar_items/FilterMenu.tsx";

/**
 * This is an interface to define the props of the NavigationBar.
 */
interface NavBarProps {
  messages: React.Dispatch<React.SetStateAction<MessageHeader[]>>;
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onAlignmentChange: React.Dispatch<React.SetStateAction<string>>;
  toggleSideBar: boolean;
  onToggleSideBar: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * This is a function to return the NavigationBar.
 * @param messages messages to be displayed.
 * @param filters filters to be applied.
 * @param onFilterChange function to change the state of filters.
 * @returns the NavBar component.
 */

function NavigationBar({
  messages,
  filters,
  onFilterChange,
  onAlignmentChange,
  toggleSideBar,
  onToggleSideBar,
}: NavBarProps) {
  const [isVisibleOptions, setIsVisibleOptions] = useState(false);
  const [index, setIndex] = useState(2);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const alignments = ["justify-self-auto", "justify-center", "justify-end"];

  const toggleFilterOptions = () => {
    setIsVisibleOptions(!isVisibleOptions);
  };

  const getFiles = async () => {
    messages(await parser.parseLogFile());
  };

  const changeAlignment = () => {
    setIndex((index + 1) % 3);
    onAlignmentChange(alignments[index]);
  };

  return (
    <nav className="bg-components-gray dark:bg-gray-900 w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a
          href="https://www.tno.nl/en/"
          className="flex items-center space-x-3 rtl:space-x-reverse"
        >
          <img 
            src={s2AnalyzerLogo} 
            className="h-10" 
            alt="TNO Logo" 
          />
        </a>
        <button 
          type="button" 
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-600" 
          onClick={() => setShowAllOptions(!showAllOptions)}
        >
          <span className="sr-only">Open main menu</span>
          <svg 
            className="w-5 h-5" 
            aria-hidden="true" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 17 14"
          >
              <path 
                stroke="currentColor" 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M1 1h15M1 7h15M1 13h15"
              />
          </svg>
        </button>
        <div
          className={`${
            showAllOptions ? "flex" : "hidden"
          } items-center justify-start w-full md:flex md:w-auto md:order-1 mt-2 md:mt-0`}
        >
          <ul className="flex flex-col md:flex-row md:space-x-8 md:border-0">
            <li>
              <a
                href ="#"
                className="block py-1 px-2 md:py-2 md:px-3 text-white rounded md:hover:text-gray-500 md:p-0"
                onClick={() => onToggleSideBar(!toggleSideBar)}
              >
                Ξ
              </a>
            </li>
            <li>
              <a
                href ="#"
                className="block py-1 px-2 md:py-2 md:px-3 text-white rounded md:hover:text-gray-500 md:p-0"
                onClick={getFiles}
              >
                Load File
              </a>
            </li>
            <li>
              <a
                href ="#"
                className="block py-1 px-2 md:py-2 md:px-3 text-white rounded md:hover:text-gray-500 md:p-0"
                onClick={toggleFilterOptions}
              >
                Filters
              </a>
              <div className="clickable-heading md:absolute">
                <FilterMenu
                  filters={filters}
                  onFilterChange={onFilterChange}
                  isVisible={isVisibleOptions}
                />
              </div>
            </li>
            <li>
              <a
                href ="#"
                className="block py-1 px-2 md:py-2 md:px-3 text-white rounded md:hover:text-gray-500 md:p-0"
                onClick={changeAlignment}
              >
                Change Alignment
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavigationBar;
