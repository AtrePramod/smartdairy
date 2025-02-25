import React from "react";
import { BsSaveFill } from "react-icons/bs";
import { VscSave } from "react-icons/vsc";
import { CiSaveUp1 } from "react-icons/ci";
import { GrUpdate } from "react-icons/gr";
import { NavLink } from "react-router-dom";

const RateChartNavlinks = ({ isselected, setIsSelected }) => {
  const ratechartnavlinks = [
    {
      name: "Save",
      icon: <VscSave className="icon" />,
      index: 0,
      path: "save",
    },
    {
      name: "Update",
      icon: <GrUpdate className="icon" />,
      index: 1,
      path: "update-save",
    },
    {
      name: "Apply",
      icon: <BsSaveFill className="icon" />,
      index: 2,
      path: "apply",
    },
    {
      name: "Add Type",
      icon: <BsSaveFill className="icon" />,
      index: 2,
      path: "apply",
    },
  ];
  return (
    <>
      {ratechartnavlinks.map((button, index) => (
        <li
          key={index}
          className={`home-nav-item d-flex a-center ${
            isselected === button.index ? "selected" : ""
          }`}
          onClick={() => {
            setIsSelected(button.index);
          }}>
          <NavLink to={button.path} className="sub-navlinks f-label-text d-flex a-center">
            {button.icon}
            <span className="info-text">{button.name}</span>
          </NavLink>
        </li>
      ))}
    </>
  );
};

export default RateChartNavlinks;
