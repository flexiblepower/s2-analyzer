import { Filters } from "../../../models/dataStructures/filters";

interface FilterMenuProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  isVisible: boolean;
}

function FilterMenu({ filters, onFilterChange, isVisible }: FilterMenuProps) {
  const handleCheckboxChange = (option: keyof Filters) => {
    const newFilters = {
      ...filters,
      [option]: !filters[option],
    };
    onFilterChange(newFilters);
  };

  return (
    <div className={`text-left ${isVisible ? 'block' : 'hidden'}`}>
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
            <label htmlFor="logs" className="text-lg text-gray-700">
              Logs
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterMenu;