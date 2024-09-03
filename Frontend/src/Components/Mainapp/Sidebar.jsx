import React from "react";
import { BsXLg } from "react-icons/bs";
import "../../Styles/Mainapp/Sidebar.css";
import Mainappnavlinks from "./Mainappnavlinks";

const Sidebar = ({ setselected, handleSidebar }) => {
  return (
    <>
      <aside id="sidebar">
        <div className="sidebar-logo d-flex center sb ">
          <div className="smartdairy-logo"></div>
          <span className="close-icon" onClick={handleSidebar}>
            <BsXLg />
          </span>
        </div>
        <ul className="sidebar-list w100 h1">
          <Mainappnavlinks
            setselected={setselected}
            handleSidebar={handleSidebar}
          />
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
