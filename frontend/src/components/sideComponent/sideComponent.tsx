
/**
 * This is an interface to define the props of the SideComponent.
 */
interface SideComponentProps {
  isVisible: boolean; // Prop for controlling initial visibility
  setIsVisible: (isVisible: boolean) => void; // Prop for controlling visibility
}

/**
 * This is a function to return the SideComponent. 
 * @param isVisible prop for controlling initial visibility.
 * @param setIsVisible prop for controlling and changing visibility.
 * @returns the Side Component.
 */
const SideComponent: React.FC<SideComponentProps> = ({ isVisible, setIsVisible }) => {

  /**
   * Function to add feature of closing the SideComponent
   * It uses the isVisible and setIsVisible props' states from the NavBar component.
   */
  const closeSideComponent = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {isVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-components-gray bg-opacity-50">
          <div className="bg-white w-96 h-full transform translate-x-full transition-transform duration-300 ease-out">
            <div className="flex justify-end">
              <button
                onClick={closeSideComponent}
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
