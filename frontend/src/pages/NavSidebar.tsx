import { Sidebar, Menu, MenuItem, sidebarClasses } from 'react-pro-sidebar';
import { Link } from 'react-router-dom';
import s2AnalyzerLogo from '../assets/s2AnalyzerLogo.png';

interface SidebarProps {
    toggled: boolean;
    setToggled: (arg0: boolean) => void;
}

const NavSidebarComponent = ({ toggled, setToggled }:SidebarProps) => {
    return (
        <Sidebar onBackdropClick={() => setToggled(false)}
                 toggled={toggled}
                 breakPoint="all"
                 rootStyles={{[`.${sidebarClasses.container}`]: {
                         backgroundColor: '#313338',
                         color: 'white',
                     },
                 }}
        >
            <div className="p-4 text-center">
                <a href="https://s2standard.org/" target="_blank" rel="noopener noreferrer">
                    <img
                        src={s2AnalyzerLogo}
                        alt="Logo"
                        className={`w-16 h-16 mx-auto block`}
                    />
                </a>
            </div>
            <Menu menuItemStyles={{
                    button: {
                        [`&:hover`]: {
                            backgroundColor: '#3a617f',
                        },
                    },
                }}
            >
                <MenuItem component={<Link to="/" />}>Real-Time Data</MenuItem>
                <MenuItem component={<Link to="/historical-data" />}>Historical Data</MenuItem>
            </Menu>
        </Sidebar>
    );
};

export default NavSidebarComponent;
