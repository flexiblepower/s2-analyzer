import { useState } from "react";
import { Filters } from "../../../models/dataStructures/filters";

/**
 * An interface for props of FilterMenu component.
 */
interface FilterMenuProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  isVisible: boolean;
}

/**
 * The component for FilterMenu. FilterMenu enables filtering messages based on specific filters.
 * @param filters The filters to apply.
 * @param onFilterChange The function to keep track of chang in filters.
 * @param isVisible The visibility of the FilterMenu component.
 * @returns the FilterMenu component.
 */

function FilterMenu({ filters, onFilterChange, isVisible }: FilterMenuProps) {
  const [isVisibleTypeFilters, setIsVisibleTypeFilters] = useState(false);
  const [isVisibleFRBCFilters, setIsVisibleFRBCFilters] = useState(false);

  // A function to handle the change in the checkbox (selecting or deselecting filters).
  const handleCheckboxChange = (option: keyof Filters) => {
    const newFilters = {
      ...filters,
      [option]: !filters[option],
    };
    onFilterChange(newFilters);
  };

  // A function to handle the visibility of the Type Filters menu.
  const handleTypeFilterVisibility = () => {
    setIsVisibleTypeFilters(!isVisibleTypeFilters);
  };

  // A function to handle the visibility of the FRBC Filters menu.
  const handleFRBCFilterVisibility = () => {
    setIsVisibleFRBCFilters(!isVisibleFRBCFilters);
  };

  return (
    <div className={`text-left ${isVisible ? "block" : "hidden"}`}>
      <div className="absolute mt-2 w-60 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5">
        <div className="py-4 px-4">
          {Object.entries(filters)
            .slice(0, 4)
            .map(([key, value]) => (
              <div className="flex items-center" key={key}>
                <input
                  type="checkbox"
                  id={key}
                  checked={value}
                  onChange={() => handleCheckboxChange(key as keyof Filters)}
                  className="mr-2 size-4"
                />
                <label htmlFor={key} className="text-lg text-gray-700">
                  {key}
                </label>
              </div>
            ))}
          {/*The Type Filter Menu*/}
          <div className="flex items-center justify-between mb-1">
            <button
              className="flex items-center ml-6 w-auto text-lg text-gray-700"
              onClick={handleTypeFilterVisibility}
            >
              Type Filters
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-4 h-4 relative ml-14"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>
          <div
            className={`text-left ml-6 text-lg ${
              isVisibleTypeFilters ? "block" : "hidden"
            }`}
          >
            {Object.entries(filters)
              .slice(4,15)
              .map(([key, value]) => (
                <div className="flex items-center" key={key}>
                  <input
                    type="checkbox"
                    id={key}
                    checked={value}
                    onChange={() => handleCheckboxChange(key as keyof Filters)}
                    className="mr-2 size-4"
                  />
                  <label htmlFor={key} className="text-gray-700 text-sm">
                    {key}
                  </label>
                </div>
              ))}
          </div>
          {/*The FRBC Filter Menu*/}
          <div className="flex items-center justify-between mb-1">
            <button
              className="flex items-center ml-6 w-auto text-lg text-gray-700"
              onClick={handleFRBCFilterVisibility}
            >
              FRBC Filters
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-4 h-4 relative ml-14"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>
          <div
            className={`text-left ml-6 text-lg ${
              isVisibleFRBCFilters ? "block" : "hidden"
            }`}
          >
            {Object.entries(filters)
              .slice(15)
              .map(([key, value]) => (
                <div className="flex items-center" key={key}>
                  <input
                    type="checkbox"
                    id={key}
                    checked={value}
                    onChange={() => handleCheckboxChange(key as keyof Filters)}
                    className="mr-2 size-4"
                  />
                  <label htmlFor={key} className="text-gray-700 text-sm">
                    {key}
                  </label>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterMenu;
