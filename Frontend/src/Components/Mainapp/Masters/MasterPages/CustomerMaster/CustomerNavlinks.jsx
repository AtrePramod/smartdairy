import React from "react";
import { useTranslation } from "react-i18next";
import { IoPersonAdd, IoList } from "react-icons/io5";
import { NavLink } from "react-router-dom";

const CustomerNavlinks = ({ isselected, setIsSelected }) => {
  const { t } = useTranslation(["master"]);
  const CustNavbuttons = [
    {
      name: `${t("m-custlist")}`,
      icon: <IoList className="icon" />,
      index: 0,
      path: "list",
    },
    {
      name: `${t("m-custadd")}`,
      icon: <IoPersonAdd className="icon" />,
      index: 1,
      path: "add-new",
    },
  ];
  return (
    <>
      {CustNavbuttons.map((button, index) => (
        <li
          key={index}
          className={`home-nav-item d-flex a-center ${
            isselected === index ? "selected" : ""
          }`}
          onClick={() => {
            setIsSelected(index);
          }}
        >
          <NavLink
            to={button.path}
            className={({ isActive }) =>
              isActive
                ? "sub-navlinks f-label-text selected"
                : "sub-navlinks f-label-text"
            }
          >
            {button.icon}
            <span>{button.name}</span>
          </NavLink>
        </li>
      ))}
    </>
  );
};

export default CustomerNavlinks;
