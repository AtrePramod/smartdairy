import React from "react";
import { BsXLg } from "react-icons/bs";
import { BiLogOutCircle } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import applogo from "../../assets/samrtdairylogo.png";
import Mainappnavlinks from "./Mainappnavlinks";
import axios from "axios";
import "../../Styles/Mainapp/Sidebar.css";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../App/Features/Users/authSlice";
import { toast } from "react-toastify";
import axiosInstance from "../../App/axiosInstance";
import { useTranslation } from "react-i18next";

const Sidebar = ({ setselected, handleSidebar }) => {
  const { t } = useTranslation(["common"]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  axios.defaults.baseURL = import.meta.env.VITE_BASE_URI;
  axios.defaults.withCredentials = true;

  const userRole = useSelector((state) => state.users.userRole);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/logout");
      localStorage.removeItem("customerlist");
      localStorage.removeItem("milkentries");
      localStorage.removeItem("milkcollrcharts");
      localStorage.removeItem("colldata");

      if (userRole === "milkcollector" || userRole === "mobilecollector") {
        localStorage.setItem("selectedTabIndex", 1);
        localStorage.setItem("selectedNavIndex", 1);
      } else {
        localStorage.setItem("selectedNavIndex", 0);
        localStorage.setItem("selectedTabIndex", 0);
      }

      localStorage.removeItem("token");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <>
      <aside id="sidebar" className="w100 h1 d-flex-col sb">
        <div className="sidebar-logo d-flex center sb ">
          <img src={applogo} alt="sm" width={"100px"} />
          <span className="close-icon" onClick={handleSidebar}>
            <BsXLg />
          </span>
        </div>
        <ul className="sidebar-list w100 h80 mh80 hidescrollbar d-flex-col px10">
          <Mainappnavlinks
            setselected={setselected}
            handleSidebar={handleSidebar}
          />
        </ul>
        <div
          className="logout-btn-div w100 d-flex a-center p10 my10"
          onClick={handleLogout}
        >
          <span className="f-heading mx10">{t("c-logout")}</span>
          <BiLogOutCircle className="logout-icon" />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
