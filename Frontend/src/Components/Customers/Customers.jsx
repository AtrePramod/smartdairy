import React, { useEffect, useState } from "react";
import CustNavbar from "./CustNavbar";
import Custnavviews from "./Custnavviews";
import Footer from "../Mainapp/Footer";
import { fetchDairyInfo } from "../../App/Features/Admin/Dairyinfo/dairySlice";
import { useDispatch, useSelector } from "react-redux";
import { generateMaster } from "../../App/Features/Customers/Date/masterdateSlice";
import "../../Styles/Customer/Customer.css";

const Customers = () => {
  const dispatch = useDispatch();

  const date = useSelector((state) => state.date.toDate);

  // Retrieve isselected from localStorage, defaulting to 0 if not set
  const [isselected, setIsselected] = useState(
    parseInt(localStorage.getItem("selectednavIndex")) || 0
  );

  // Update localStorage whenever isselected changes
  useEffect(() => {
    localStorage.setItem("selectednavIndex", isselected);
  }, [isselected]);

  // Handle back button click to reset the index to 0
  const handleBackButton = () => {
    setIsselected(0); // Set isselected to 0
  };

  useEffect(() => {
    dispatch(fetchDairyInfo());
    dispatch(generateMaster(date));
  }, []);

  return (
    <div className="customer-container w100 h100 d-flex-col">
      <CustNavbar
        handleBackButton={handleBackButton}
        setselected={setIsselected}
      />
      <div className="customer-nav-view-container w100 h90 d-flex">
        <Custnavviews setselected={setIsselected} index={isselected} />
      </div>
    </div>
  );
};

export default Customers;
