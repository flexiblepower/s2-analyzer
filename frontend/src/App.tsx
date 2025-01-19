import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import BackendContext from "./BackendContext";
import MainPage from "./pages/MainPage.tsx";

/**
 * The Visual Application that contains the page(s) (or components)
 * @returns The Visual Application component
 */
function App() {
    const backend = 'http://localhost:8001';

    return (
        <Router>
            {/* Wrap the Routes in BackendContext.Provider */}
            <BackendContext.Provider value={backend}>
                <Routes>
                    <Route path="/" element={<MainPage/>} />
                </Routes>
            </BackendContext.Provider>
        </Router>
    );
}

export default App;
