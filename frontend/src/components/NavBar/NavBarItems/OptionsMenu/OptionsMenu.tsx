import { useState } from "react";
import FilterMenu from "./FilterMenu";

function OptionsMenu() {
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const toggleOptionsMenu = () => {
    setShowOptionsMenu(!showOptionsMenu);
    if (showFilterMenu) {
      setShowFilterMenu(false);
    }
  };

  const toggleFilterMenu = (event: any) => {
    event.stopPropagation();
    setShowFilterMenu(!showFilterMenu);
  };

  return (
    <div className="flex justify-end items-center">
      <div className="relative inline-block text-left">
        <button
          onClick={toggleOptionsMenu}
          className="relative rounded-md font-medium text-white text-3xl hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
        >
          Options
        </button>
        {showOptionsMenu && (
          <div className="absolute mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none transition ease-out duration-100 transform opacity-100 scale-100">
            <div className="px-4 py-4">
              <button
                onClick={toggleFilterMenu}
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
          <FilterMenu />
        </div>
      )}
    </div>
  );
}

export default OptionsMenu;
