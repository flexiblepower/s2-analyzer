import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import BackendContext from './BackendContext';
import RealtimeDataPage from './pages/RealtimeDataPage.tsx';
import HistoricalDataPage from "./pages/HistoricalDataPage.tsx";
import {useState} from "react";
import NavSidebarComponent from "./pages/NavSidebar.tsx";
import MessageValidationPage from "./pages/MessageValidationPage.tsx";

/**
 * The Visual Application that contains the page(s) (or components)
 * @returns The Visual Application component
 */
function App() {
    const backend = 'http://localhost:8001/backend';
    const [toggled, setToggled] = useState(false);

    return (
        <Router>
            <BackendContext.Provider value={backend}>
                <div className="flex">
                    {/* Navigation Sidebar */}
                    <NavSidebarComponent toggled={toggled} setToggled={setToggled} />

                    {/* Main Content */}
                    <main className="flex-1 bg-base-gray">
                        <button className="w-full bg-tno-blue py-2" onClick={() => setToggled(!toggled)}
                                style={{ color: 'white' }}
                        >
                            Toggle Navigation Menu
                        </button>
                        <Routes>
                            <Route path="/" element={<Navigate to="/real-time" />} />
                            <Route path="/real-time" element={<RealtimeDataPage />} />
                            <Route path="/historical-data" element={<HistoricalDataPage />} />
                            <Route path="/validate-message" element={<MessageValidationPage />} />
                        </Routes>
                    </main>
                </div>
            </BackendContext.Provider>
        </Router>
    );
}

export default App;
