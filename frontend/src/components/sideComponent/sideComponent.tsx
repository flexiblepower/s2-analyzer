import React, { useState } from 'react';

interface SideComponentProps {
  isVisible: boolean; // Prop for controlling initial visibility
}

const SideComponent: React.FC<SideComponentProps> = ({ isVisible }) => {
  const [sideComponentVisible, setSideComponentVisible] = useState(isVisible);

  const toggleSideComponent = () => {
    setSideComponentVisible(!sideComponentVisible);
  };

  return (
    <>
      {sideComponentVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-components-gray bg-opacity-50">
          <div className="bg-white w-96 h-full transform translate-x-full transition-transform duration-300 ease-out">
            <div className="flex justify-end">
              <button
                onClick={toggleSideComponent}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={toggleSideComponent}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SideComponent;
