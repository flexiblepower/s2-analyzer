import { Sidebar, Menu, MenuItem, sidebarClasses } from 'react-pro-sidebar';
import { Link } from 'react-router-dom';
import s2AnalyzerLogo from '../assets/s2AnalyzerLogo.png';

interface NavSidebarProps {
    toggled: boolean;
    setToggled: (arg0: boolean) => void;
}

const NavSidebarComponent = ({ toggled, setToggled }:NavSidebarProps) => {
    return (
        <Sidebar onBackdropClick={() => setToggled(false)}
                 toggled={toggled}
                 breakPoint="all"
                 rootStyles={{
                     [`.${sidebarClasses.container}`]: {
                         backgroundColor: '#313338',
                         color: 'white',
                         boxShadow: '2px 0px 10px rgba(0, 0, 0, 0.5)',
                         borderRight: '1px solid #444',
                     },
                 }}
        >
            <div className="p-3 text-center">
                <a href="https://s2standard.org/" target="_blank" rel="noopener noreferrer">
                    <img src={s2AnalyzerLogo} alt="Logo" className={`w-20 h-20 mx-auto block`}/>
                </a>
            </div>
            <div className="border-t-2 border-gray-500 my-2"></div>
            <Menu menuItemStyles={{
                button: {
                    [`&:hover`]: {
                        backgroundColor: '#3a617f',
                    },
                    textAlign: 'center',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    margin: '0.5rem 1rem',
                },
            }}
            >
                <MenuItem component={<Link to="/real-time"/>}>Real-Time Data</MenuItem>
                <MenuItem component={<Link to="/historical-data"/>}>Historical Data</MenuItem>
                <MenuItem component={<Link to="/validate-message"/>}>Validate Message</MenuItem>
                <MenuItem component={<Link to="/inject-message"/>}>Inject Message</MenuItem>
            </Menu>
        </Sidebar>
    );
};

export default NavSidebarComponent;
