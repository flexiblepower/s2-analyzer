import React, { useState } from "react";
import tnologo from "../../assets/TNO-logo.svg"
import MessageHeader from "../../models/messages/messageHeader.ts";
import { Filters } from "../../models/dataStructures/filters.ts";
import { parser } from "../../parser/Parser.ts";
import FilterMenu from "./navbar_items/FilterMenu.tsx";
import SideComponent from "../sideComponent/SideComponent.tsx";

/**
 * This is an interface to define the props of the NavigationBar.
 */
interface NavBarProps {
  messages: React.Dispatch<React.SetStateAction<MessageHeader[]>>;
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

/**
 * This is a function to return the NavigationBar.
 * @param messages messages to be displayed.
 * @param filters filters to be applied.
 * @param onFilterChange function to change the state of filters.
 * @returns the NavBar component.
 */

function NavigationBar({ messages, filters, onFilterChange }: NavBarProps) {
  const [isVisibleOptions, setIsVisibleOptions] = useState(false);
  const [isSideComponentVisible, setIsSideComponentVisible] = useState(false);

  const toggleFilterOptions = () => {
    setIsVisibleOptions(!isVisibleOptions);
  };

  const getFiles = async () => {
    messages(await parser.parseLogFile());
  };

  const toggleSideComponent = () => {
    setIsSideComponentVisible(!isSideComponentVisible);
  };

  return (
    <nav className="bg-components-gray dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
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
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-components-gray dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <a
                href="#"
                className="block py-2 px-3 text-white rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-tno-blue md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
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
                className="block py-2 px-3 text-white rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-tno-blue md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                onClick={getFiles}
              >
                Load File
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block py-2 px-3 text-white rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-tno-blue md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                onClick={toggleSideComponent}
              >
                Message List
              </a>
            </li>
          </ul>
        </div>
      </div>
      <SideComponent isVisible={isSideComponentVisible} setIsVisible={setIsSideComponentVisible}/>
      {/*The SideComponent needs to be moved to the Page.tsx because it is another main component, it can't be inside of the NavBar. */}
    </nav>
  );
}

export default NavigationBar;
