// eslint-disable-next-line no-unused-vars
import React from "react";
import { IoPersonAdd, IoList } from "react-icons/io5";

// eslint-disable-next-line react/prop-types
const OthersNavlinks = ({ isselected, setIsSelected }) => {
  const CustNavbuttons = [
    { name: "Purchase List", icon: <IoList className="icon" />, index: 0 },
    {
      name: "Add Purchase",
      icon: <IoPersonAdd className="icon" />,
      index: 1,
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
          <a>
            {button.icon}
            <span>{button.name}</span>
          </a>
        </li>
      ))}
    </>
  );
};

export default OthersNavlinks;
