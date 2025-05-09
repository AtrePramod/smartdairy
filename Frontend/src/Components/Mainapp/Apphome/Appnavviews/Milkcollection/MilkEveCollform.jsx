import React, { useEffect, useState } from "react";
import MilkCollform from "./Milkcollform";
import CollSettings from "./CollSettings";
import "../../../../../Styles/Mainapp/Apphome/Appnavview/collsetting.css";
import { useDispatch, useSelector } from "react-redux";
import { listCustomer } from "../../../../../App/Features/Customers/customerSlice";

const form_type = {
  collection: "Coll",
  settings: "settings",
};

const MilkEveCollform = () => {
  const dispatch = useDispatch();
  const [currentForm, setCurrentForm] = useState(form_type.collection);
  const switchToColl = () => setCurrentForm(form_type.collection);
  const switchToSettings = () => setCurrentForm(form_type.settings);

  const { customerlist } = useSelector((state) => state.customer); //save customer list

  useEffect(() => {
    if (customerlist && customerlist.length > 0) {
      localStorage.setItem("customerlist", JSON.stringify(customerlist));
    }
  }, [customerlist]);

  return (
    <div className="forms-container-div w100 h1 d-flex center">
      {currentForm === form_type.collection && (
        <MilkCollform switchToSettings={switchToSettings} />
      )}
      {currentForm === form_type.settings && (
        <CollSettings switchToColl={switchToColl} />
      )}
    </div>
  );
};

export default MilkEveCollform;
