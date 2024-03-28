import React, { useState } from "react";
import MessageHeader from "../../../../models/messages/messageHeader.ts";

type SelectedFilters = {
  CEM: boolean;
  RM: boolean;
  min: number | null;
  max: number | null;
  logs: boolean;
  warnings: boolean;
};

interface Props {
  selected: React.Dispatch<React.SetStateAction<(m: MessageHeader) => boolean>>
}

function FilterMenu(props:Props) {

  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    CEM: true,
    RM: true,
    min: null,
    max: null,
    logs: true,
    warnings: true
  });

  const handleCheckboxChange = (option: keyof SelectedFilters) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [option]: !prev[option],
    }))
    updateFilter()
  };

  const updateFilter = () => {
    props.selected((m:MessageHeader) => (
        ((selectedFilters.CEM && m.sender=="CEM") || (selectedFilters.RM && m.sender=="RM")) &&
        ((selectedFilters.min && selectedFilters.max) ? (m.time.getTime()>=selectedFilters.min && m.time.getTime()<=selectedFilters.max) : true) &&
        ((selectedFilters.logs && m.message_id!=null) || (selectedFilters.warnings && m.message_id==null))
    ))
  }

  return (
    <div className="relative inline-block text-left">
      <div className="absolute mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5">
        <div className="py-4 px-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="CEM"
              checked={selectedFilters.CEM}
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
              checked={selectedFilters.RM}
              onChange={() => handleCheckboxChange("RM")}
              className="mr-2 size-4"
            />
            <label htmlFor="RM" className="text-lg text-gray-700">
              RM
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterMenu;
