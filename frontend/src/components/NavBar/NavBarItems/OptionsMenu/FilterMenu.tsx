import { useState } from "react";

type SelectedFilters = {
  REM: boolean;
  CM: boolean;
};

function FilterMenu() {
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    REM: false,
    CM: false,
  });

  const handleCheckboxChange = (option: keyof SelectedFilters) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  return (
    <div className="relative inline-block text-left">
      <div className="absolute mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5">
        <div className="py-4 px-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="REM"
              checked={selectedFilters.REM}
              onChange={() => handleCheckboxChange("REM")}
              className="mr-2 size-4"
            />
            <label htmlFor="REM" className="text-lg text-gray-700">
              REM
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="CM"
              checked={selectedFilters.CM}
              onChange={() => handleCheckboxChange("CM")}
              className="mr-2 size-4"
            />
            <label htmlFor="CM" className="text-lg text-gray-700">
              CM
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterMenu;
