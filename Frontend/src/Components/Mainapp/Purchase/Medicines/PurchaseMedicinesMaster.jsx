// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
// import "../../../../../Styles/Mainapp/Masters/CustomerMaster.css";
// import { useDispatch } from "react-redux";
// import { getMaxCustNo } from "../../../../../App/Features/Customers/customerSlice";

import MedicinesNavlinks from "./MedicinesNavlinks";
import MedicinesNavViews from "./MedicinesNavViews";

const PurchaseMedicinesMaster = () => {
  // const dispatch = useDispatch();
  const [isselected, setIsSelected] = useState(
    parseInt(localStorage.getItem("selectedMedicinespurIndex")) || 0
  );

  // Update localStorage whenever isselected changes
  useEffect(() => {
    localStorage.setItem("selectedMedicinespurIndex", isselected);
  }, [isselected]);

  // useEffect(() => {
  //   localStorage.setItem("selectedCustIndex", isselected);
  // }, [isselected]);

  // useEffect(() => {
  //   dispatch(getMaxCustNo());
  // }, []);

  return (
    <div className="customer-master-container w100 h1 d-flex-col">
      <div className="customer-master-navigation w100 h10 d-flex bg3">
        <MedicinesNavlinks
          isselected={isselected}
          setIsSelected={setIsSelected}
        />
      </div>
      <div className="customer-views w100 h90 d-flex center">
        <MedicinesNavViews index={isselected} />
      </div>
    </div>
  );
};

export default PurchaseMedicinesMaster;
