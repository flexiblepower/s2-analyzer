import { Filters } from "../../../../models/filters";

/**
 * The properties for the FilterMenu component.
 */
interface FilterMenuProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

/**
 * The component for the Filter Menu.
 * @param filters The applied filters.
 * @param onFilterChange The function to change the filters.
 * @returns the Filter Menu.
 */
function FilterMenu({ filters, onFilterChange }: FilterMenuProps) {
  const handleCheckboxChange = (option: keyof Filters) => {
    const newFilters = {
      ...filters,
      [option]: !filters[option],
    };
    onFilterChange(newFilters);
  };

  return (
    <div className="relative inline-block text-left">
      <div className="absolute mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5">
        <div className="py-4 px-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="CEM"
              checked={filters.CEM}
              onChange={() => handleCheckboxChange("CEM")}
              className="mr-2 size-4"
            />
            <label htmlFor="CEM" className="text-lg text-gray-700">
              CEM
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="RM"
              checked={filters.RM}
              onChange={() => handleCheckboxChange("RM")}
              className="mr-2 size-4"
            />
            <label htmlFor="RM" className="text-lg text-gray-700">
              RM
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="warning"
              checked={filters.warnings}
              onChange={() => handleCheckboxChange("warnings")}
              className="mr-2 size-4"
            />
            <label htmlFor="warnings" className="text-lg text-gray-700">
              Warnings
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="logs"
              checked={filters.logs}
              onChange={() => handleCheckboxChange("logs")}
              className="mr-2 size-4"
            />
            <label htmlFor="warnings" className="text-lg text-gray-700">
              Logs
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterMenu;
