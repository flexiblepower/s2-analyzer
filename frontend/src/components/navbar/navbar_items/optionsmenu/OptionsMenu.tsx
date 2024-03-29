import React, { useState } from "react";
import FilterMenu from "./FilterMenu";
import { Filters } from "../../../../models/filters";

/**
 * The properties for the OptionsMenu component.
 */
interface OptionsMenuProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

/**
 * The component for the Options Menu.
 * @param filters The applied filters.
 * @param onFilterChange The function to change the filters.
 * @returns the Options Menu.
 */
function OptionsMenu({ filters, onFilterChange }: OptionsMenuProps) {
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Change the visibility of the Options Menu.
  const toggleOptionsMenu = () => {
    setShowOptionsMenu(!showOptionsMenu);
    if (showFilterMenu) {
      setShowFilterMenu(false);
    }
  };

  // Change the visibility of the Filter Menu.
  const toggleFilterMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowFilterMenu(!showFilterMenu);
  };

  return (
    <div className="flex justify-end items-center">
      <div className="relative inline-block text-left">
        <button
          onClick={toggleOptionsMenu}
          className="relative rounded-md font-medium text-white text-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
        >
          Options
        </button>
        {showOptionsMenu && (
          <div className="absolute mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none transition ease-out duration-100 transform opacity-100 scale-100">
            <div className="px-4 py-4">
              <button
                onClick={(e) => toggleFilterMenu(e)}
                className={`text-gray-900 group flex w-full items-center rounded-md px-2 py-2 text-sm`}
              >
                Filters
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 ml-32"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      {showFilterMenu && (
        <div className="relative ml-24">
          <FilterMenu filters={filters} onFilterChange={onFilterChange} />
        </div>
      )}
    </div>
  );
}

export default OptionsMenu;
