import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { generateMaster } from "../../../App/Features/Customers/Date/masterdateSlice";
import {
  getDeductionInfo,
  resetDeduction,
} from "../../../App/Features/Deduction/deductionSlice";
import { BsCalendar3 } from "react-icons/bs";
import Spinner from "../../Home/Spinner/Spinner";
import { useTranslation } from "react-i18next";

const CustDeductions = () => {
  const { t } = useTranslation("common");
  const dispatch = useDispatch();
  const date = useSelector((state) => state.date.toDate);
  const master = useSelector((state) => state.masterdates.masterlist);
  const deduction = useSelector((state) => state.deduction.deductionInfo);
  const subdeduction = useSelector((state) => state.deduction.subdeductions);
  const status = useSelector((state) => state.deduction.status);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Generate master dates based on the initial date
  useEffect(() => {
    dispatch(generateMaster(date));
  }, []);

  // Handle the date selection
  const handleSelectChange = (e) => {
    const selectedIndex = e.target.value;
    if (selectedIndex !== "") {
      const selectedDates = master[selectedIndex];
      setSelectedPeriod(selectedDates);
      // Dispatch the action with the selected fromDate and toDate
      dispatch(resetDeduction());
      dispatch(
        getDeductionInfo({
          fromDate: selectedDates.fromDate,
          toDate: selectedDates.toDate,
        })
      );
    }
  };

  return (
    <div className="deduction-info-container w100 h1 d-flex-col">
      <div className="title-select-date w100 h20 d-flex-col p10">
        <div className="menu-title-div w100 h50 d-flex p10">
          <h2 className="f-heading">{t("c-page-title-deduct")}</h2>
        </div>
        <div className="custmize-report-div w100 h50 px10 d-flex a-center sb">
          <span className="cl-icon w10 h1 d-flex center">
            <BsCalendar3 />
          </span>
          <select
            className="custom-select sub-heading w80 h1 p10"
            onChange={handleSelectChange}>
            <option className="sub-heading">--{t("c-select-master")}--</option>
            {master.map((dates, index) => (
              <option className="sub-heading" key={index} value={index}>
                {new Date(dates.fromDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short", // Abbreviated month format
                  year: "numeric",
                })}{" "}
                To:{" "}
                {new Date(dates.toDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short", // Abbreviated month format
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="purchase-details-table w100 h80 d-flex j-center p10 bg">
        {status === "loading" ? (
          <div className="w100 h80 d-flex center">
            <Spinner />
          </div>
        ) : subdeduction.length > 0 ? (
          <div className="deduction-info-container w100 mh80 d-flex ">
            <div className="deduction-info-details w100 h1 d-flex-col p10">
              <div className="date-billno-div w100 h20 d-flex sb">
                <div className="dates w50 h10 d-flex sb">
                  <span className="text">{t("c-date")} : </span>
                  <span className="info-text">
                    {deduction?.ToDate
                      ? new Date(deduction.ToDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="bill-div w30 h10 d-flex sb">
                  <span className="text">{t("c-billno")} : </span>
                  <span className="info-text">{deduction.BillNo || "N/A"}</span>
                </div>
              </div>
              <div className="rate-amount w100 h80 d-flex-col">
                <div className="rate w100 h10 d-flex sb">
                  <span className="text">{t("c-t-liters")} :</span>
                  <span className="info-text">
                    {deduction.tliters || "N/A"}
                  </span>
                </div>
                <div className="Amount w100 h10 d-flex sb">
                  <span className="text">{t("c-avg-rate")} :</span>
                  <span className="info-text">{deduction.arate || "N/A"}</span>
                </div>
                <div className="rate w100 h10 d-flex sb">
                  <span className="text">{t("c-pay-amt")} :</span>
                  <span className="info-text">{deduction.pamt || "N/A"}</span>
                </div>
                <div className="sub-deductions w100 h50 mh40 d-flex-col sb my10">
                  <span className="info-text">
                    {t("c-page-title-deduct")} :
                  </span>
                  <hr />
                  {subdeduction.map((deduction, index) => (
                    <div key={index} className="Amount w100 h30 d-flex sb">
                      <span className="text">{deduction.dname} :</span>
                      <span className="info-text">
                        {deduction.Amt || "N/A"}
                      </span>
                    </div>
                  ))}
                  <hr />
                </div>
                <div className="Amount w100 h10 d-flex sb">
                  <span className="text">{t("c-t-deduct")} :</span>
                  <span className="info-text">{deduction.damt || "N/A"}</span>
                </div>
                <div className="rate w100 h10 d-flex sb">
                  <span className="text">{t("c-net-pay")} :</span>
                  <span className="info-text">{deduction.namt || "0"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w100 h1 d-flex center">
            <span className="heading">{t("c-no-data-avai")}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustDeductions;
