import React, { useState } from "react";
import tnologo from "../../assets/TNO-logo.svg"
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
  onAlignmentChange: React.Dispatch<React.SetStateAction<string>>
}

/**
 * This is a function to return the NavigationBar.
 * @param messages messages to be displayed.
 * @param filters filters to be applied.
 * @param onFilterChange function to change the state of filters.
 * @returns the NavBar component.
 */

function NavigationBar({ messages, filters, onFilterChange, onAlignmentChange }: NavBarProps) {
  const [isVisibleOptions, setIsVisibleOptions] = useState(false);
  const [index, setIndex] = useState(2)
  const alignments = ["justify-self-auto", "justify-center", "justify-end"]

  const toggleFilterOptions = () => {
    setIsVisibleOptions(!isVisibleOptions);
  };

  const getFiles = async () => {
    messages(await parser.parseLogFile());
  };

  const changeAlignment = () => {
    setIndex((index+1)%3)
    onAlignmentChange(alignments[index])
  }

  return (
      <nav className="bg-components-gray dark:bg-gray-900 w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <a
              href="https://www.tno.nl/en/"
              className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <img src={tnologo} className="h-8" alt="TNO Logo" />
          </a>
          <div
              className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
              id="navbar-sticky"
          >
            <ul className="flex md:p-0 font-medium md:space-x-8 md:flex-row md:mt-0 md:border-0 md:bg-components-gray">
              <li>
                <a
                    href="#"
                    className="block py-2 px-3 text-white rounded md:hover:text-yellow-200 md:p-0"
                    onClick={getFiles}
                >
                  Load File
                </a>
              </li>
              <li>
                <a
                    href="#"
                    className="block py-2 px-3 text-white rounded md:hover:text-yellow-200 md:p-0"
                    onClick={toggleFilterOptions}
                >
                  Filters
                </a>
                <div className="clickable-heading">
                  <FilterMenu
                      filters={filters}
                      onFilterChange={onFilterChange}
                      isVisible={isVisibleOptions}
                  />
                </div>
              </li>
              <li>
                <a
                    href="#"
                    className="block py-2 px-3 text-white rounded md:hover:text-yellow-200 md:p-0"
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