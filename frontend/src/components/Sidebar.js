import React from "react";
import { IoMdClose } from "react-icons/io";
import { 
  HiHome, 
  HiFolder, 
  HiUserGroup, 
  HiCalendar, 
  HiDocumentText, 
  HiUserCircle 
} from "react-icons/hi";
import { NavLink } from "react-router-dom";
import Logo from "../assets/logo";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const { user, loading } = useAuth();
  
  const closeSidebarOverlay = () => {
    if (isSidebarOpen && window.matchMedia("(max-width: 768px)").matches) {
      toggleSidebar();
    }
  };
  
  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      <div className="head">
        <span className="logo">
          <Logo />
          <h1>Projo</h1>
        </span>
        <button onClick={toggleSidebar} className="close">
          <IoMdClose />
        </button>
      </div>
      <div className="prof">
        <div className="prof-img"></div>
        {loading ? (
          <div className="loading-placeholder">
            <p>Loading...</p>
          </div>
        ) : user ? (
          <>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </>
        ) : (
          <div className="not-logged-in">
            <p>Not logged in</p>
          </div>
        )}
      </div>
      <nav className="nav-links">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "active-link" : "")}
          onClick={closeSidebarOverlay}
        >
          <HiHome className="icon" />
          Dashboard
        </NavLink>
        <NavLink
          to="/projects"
          className={({ isActive }) => (isActive ? "active-link" : "")}
          onClick={closeSidebarOverlay}
        >
          <HiFolder className="icon" />
          Projects
        </NavLink>
        <NavLink
          to="/teams"
          className={({ isActive }) => (isActive ? "active-link" : "")}
          onClick={closeSidebarOverlay}
        >
          <HiUserGroup className="icon" />
          Teams
        </NavLink>
        <NavLink
          to="/events"
          className={({ isActive }) => (isActive ? "active-link" : "")}
          onClick={closeSidebarOverlay}
        >
          <HiCalendar className="icon" />
          Events
        </NavLink>
        <NavLink
          to="/notes"
          className={({ isActive }) => (isActive ? "active-link" : "")}
          onClick={closeSidebarOverlay}
        >
          <HiDocumentText className="icon" />
          Notes
        </NavLink>
        <NavLink
          to="/contacts"
          className={({ isActive }) => (isActive ? "active-link" : "")}
          onClick={closeSidebarOverlay}
        >
          <HiUserCircle className="icon" />
          Contacts
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
