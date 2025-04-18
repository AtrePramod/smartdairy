import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  completedMilkSankalan,
  fetchMobileColl,
  updateMobileColl,
} from "../../../../../App/Features/Mainapp/Milk/MilkCollectionSlice";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import "../../../../../Styles/Mainapp/Apphome/Appnavview/Milkcollection.css";
import Spinner from "../../../../Home/Spinner/Spinner";
import { listEmployee } from "../../../../../App/Features/Mainapp/Masters/empMasterSlice";
import { getRateCharts } from "../../../../../App/Features/Mainapp/Masters/rateChartSlice";
import axiosInstance from "../../../../../App/axiosInstance";
import { store } from "../../../../../App/Store";
import { saveMessage } from "../../../../../App/Features/Mainapp/Dairyinfo/smsSlice";

const CompleteMilkColl = () => {
  const { t } = useTranslation(["milkcollection", "common"]);
  const dispatch = useDispatch();
  const colldata = useSelector(
    (state) => state.milkCollection.mobileCollection
  ); //mobile milk collection data
  const dairyname = useSelector(
    (state) =>
      state.dairy.dairyData.SocietyName || state.dairy.dairyData.center_name
  );
  const centerid = useSelector(
    (state) =>
      state.dairy.dairyData.center_id || state.dairy.dairyData.center_id
  );
  const dairyphone = useSelector(
    (state) => state.dairy.dairyData.PhoneNo || state.dairy.dairyData.mobile
  );
  const customerlist = useSelector(
    (state) => state.customers.customerlist || []
  );
  const milkcollRatechart = useSelector((state) => state.ratechart.rateChart);
  const sankalak = useSelector((state) => state.userinfo.profile.emp_name);
  const status = useSelector((state) => state.milkCollection.compcollstatus); //completed collection status
  const Emplist = useSelector((state) => state.emp.emplist || []);
  const [errors, setErrors] = useState({});
  const [time, setTime] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [customerList, setCustomerList] = useState([]);
  const [collectionList, setCollectionList] = useState([]);
  const [milkRateChart, setMilkRatechart] = useState([]);
  const smapleRef = useRef(null);
  const fatRef = useRef(null);
  const snfRef = useRef(null);
  useEffect(() => {
    dispatch(listEmployee());
    dispatch(fetchMobileColl());
  }, [dispatch]);

  const [values, setValues] = useState({
    date: new Date().toISOString().split("T")[0],
    code: "",
    time: 0,
    liters: "",
    fat: "",
    snf: "",
    amt: "",
    degree: 0,
    rate: "",
    cname: "",
    acccode: "",
    rcName: "",
    sample: "",
  });
  const centerSetting = useSelector(
    (state) => state.dairySetting.centerSetting
  );
  const [settings, setSettings] = useState({});

  //set setting
  useEffect(() => {
    if (centerSetting?.length > 0) {
      setSettings(centerSetting[0]);
    }
  }, [centerSetting]);

  // Effect to get rate chart from backend -------------------------------------------------------->
  useEffect(() => {
    dispatch(getRateCharts());
  }, [dispatch]);

  // effect to set rate chart --------------------------------------------------------------------->
  useEffect(() => {
    setMilkRatechart(milkcollRatechart);
  }, [milkcollRatechart]);

  const validateField = (name, value) => {
    let error = {};

    switch (name) {
      case "sample":
        if (!/^\d+$/.test(value.toString())) {
          error[name] = "Invalid Customer code.";
        } else {
          delete errors[name];
        }
        break;

      case "cname":
        if (!/^[a-zA-Z\s]+$/.test(value)) {
          error[name] = "Invalid Customer Name.";
        } else {
          delete errors[name];
        }
        break;

      case "liters":
        if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
          error[name] = "Invalid liters.";
        } else {
          delete errors[name];
        }
        break;

      case "fat":
      case "snf":
        if (!/^\d+(\.\d{1,1})?$/.test(value.toString())) {
          error[name] = `Invalid ${[name]}.`;
        } else {
          delete errors[name];
        }
        break;

      default:
        break;
    }

    return error;
  };

  const validateFields = () => {
    const fieldsToValidate = ["cname", "liters", "fat", "snf", "rate", "amt"];

    const validationErrors = {};
    fieldsToValidate.forEach((field) => {
      const fieldError = validateField(field, values[field]);
      if (Object.keys(fieldError).length > 0) {
        validationErrors[field] = fieldError[field];
      }
    });

    setErrors(validationErrors);
    return validationErrors;
  };

  // handle input fields ------------------------------------------------------------------------>
  const handleInputs = (e) => {
    const { name, value } = e.target;

    if (name === "date") {
      if (value > tDate) {
        // Set an error for the date field
        setErrors((prevErrors) => ({
          ...prevErrors,
          date: "Selected date cannot be greater than the current date.",
        }));
        return; // Prevent updating the state if the date is invalid
      } else {
        // Clear the error if the date is valid
        setErrors((prevErrors) => {
          const { date, ...rest } = prevErrors;
          return rest; // Remove date error if valid
        });
      }

      // Update the values state
      setValues((prevValues) => ({
        ...prevValues,
        [name]: value,
      }));

      // Validate the field for other errors
      const fieldError = validateField(name, value);
      setErrors((prevErrors) => ({
        ...prevErrors,
        ...fieldError,
      }));
    }

    setValues({ ...values, [name]: value });

    // Validate field and update errors state
    const fieldError = validateField(name, value);
    setErrors((prevErrors) => ({
      ...prevErrors,
      ...fieldError,
    }));
  };

  //handle keydown event ------------------------------------------------------------------------>
  const handleKeyDown = (e, nextRef) => {
    if (e.key === "Enter" && nextRef.current) {
      e.preventDefault();
      nextRef.current.focus();
    }
  };

  // handle morning evening ------------------------------------------------------>
  const handleTime = () => {
    setTime((prev) => !prev);
    setValues((prevData) => ({
      ...prevData,
      time: !time ? 0 : 1,
    }));
  };

  const milkCollectors = useMemo(() => {
    return Emplist.filter((emp) => emp.designation === "mobilecollector");
  }, [Emplist]);

  // used for decimal input correction -------------------------------------------------------->
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Validate and allow only numeric input with an optional single decimal point
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear previous errors if the input is valid
      setErrors((prevErrors) => {
        const { [name]: removedError, ...rest } = prevErrors;
        return rest; // Remove the specific error for this field
      });
    } else {
      // Set an error for invalid input
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]:
          "Invalid input. Only numbers and one decimal point are allowed.",
      }));
      return; // Stop further processing if input is invalid
    }

    // Normalize the value only when it's a valid integer and greater than 9
    if (/^\d+$/.test(value) && value.length > 1) {
      const normalizedValue = (parseInt(value, 10) / 10).toFixed(1);
      setValues((prev) => ({
        ...prev,
        [name]: normalizedValue,
      }));
    }
  };

  //------------------------------------------------------------------------------------------------->
  // vehicle milk collection retrive and store to complete -------------------->
  useEffect(() => {
    // When the customer list is updated, store it in localStorage
    if (colldata) {
      localStorage.setItem("colldata", JSON.stringify(colldata));
    }
  }, []);

  // Effect to load customer list from local storage
  useEffect(() => {
    const storedCollList = localStorage.getItem("colldata");
    if (storedCollList) {
      setCollectionList(JSON.parse(storedCollList));
    }
  }, [dispatch]);

  //------------------------------------------------------------------------------------------------->

  // Effect to load customer list from local storage ------------------------------------------>
  useEffect(() => {
    const custLists = customerlist.filter(
      (customer) => customer.centerid === centerid
    );
    setCustomerList(custLists);
  }, [customerlist]);

  // Retrieve the stored rate chart from localStorage on component mount ---------------------------->
  // useEffect(() => {
  //   const storedRateChart = localStorage.getItem("milkcollrcharts");
  //   if (storedRateChart) {
  //     try {
  //       const parsedRateChart = JSON.parse(storedRateChart);
  //       setMilkRatechart(parsedRateChart);
  //     } catch (error) {
  //       console.error(
  //         "Failed to parse milkcollrchart from localStorage:",
  //         error
  //       );
  //     }
  //   } else {
  //     console.log("No data found in localStorage for milkcollrchart");
  //   }
  // }, []);

  // finding rate and calculating amount and degree

  const calculateRateAndAmount = async () => {
    try {
      const { fat, snf, liters, rcName } = values;

      const parsedFat = parseFloat(fat);
      const parsedSnf = parseFloat(snf);
      const parsedLiters = parseFloat(liters);
      // const degree = (parsedFat * parsedSnf).toFixed(2);
      // console.log(milkRateChart);
      const rateEntry = milkRateChart.find(
        (entry) =>
          entry.fat === parsedFat &&
          entry.snf === parsedSnf &&
          entry.rctypename === rcName
      );
      if (rateEntry) {
        const rate = parseFloat(rateEntry.rate);
        const amount = rate * parsedLiters;

        setValues((prev) => ({
          ...prev,
          rate: rate.toFixed(2),
          amt: amount.toFixed(2),
          degree: 0,
        }));
      } else {
        setValues((prev) => ({
          ...prev,
          rate: 0,
          amt: 0,
          degree: 0,
        }));
      }
    } catch (error) {
      console.error("Error calculating rate and amount:", error);
    }
  };

  // Trigger calculation whenever liters, fat, or snf change
  useEffect(() => {
    if (values.liters && values.fat && values.snf) {
      calculateRateAndAmount();
    }
  }, [values.liters, values.fat, values.snf]);

  //finding customer name
  const findmilkCollByCode = (code) => {
    // Ensure the code is a string for comparison
    const customer = customerList.find(
      (customer) => customer.srno.toString() === code.toString()
    );
    if (customer) {
      setValues((prev) => ({
        ...prev,
        acccode: customer.cid,
        rcName: customer.rcName,
      }));
    }
  };

  //  >>>>>>>>>> ----------------------------------------------------------------------------->
  //Finding Milk Collection By Code
  const findCustomerBySample = (sample) => {
    if (!sample) {
      setValues((prev) => ({ ...prev, code: "", cname: "", liters: "" }));
      return;
    }
    // Ensure the code is a string for comparison
    const collection = collectionList.find(
      (collection) =>
        collection.SampleNo.toString() === sample &&
        collection.ME.toString() === values.time.toString() &&
        collection.userid === selectedEmp.toString()
    );
    if (collection) {
      setValues((prev) => ({
        ...prev,
        cname: collection.cname,
        code: collection.rno,
        liters: collection.Litres,
        rcName: collection.rcName,
        userid: collection.userid,
      }));
      findmilkCollByCode(collection.rno);
    } else {
      setValues((prev) => ({
        ...prev,
        code: "",
        cname: "",
        liters: "",
        rcName: "",
      })); // Clear cname if not found
    }
  };

  //Finding Milk Collection By Code
  const findCustomerByCode = (code) => {
    if (!code) {
      setValues((prev) => ({ ...prev, code: "", cname: "", liters: "" }));
      return;
    }
    // Ensure the code is a string for comparison
    const collection = collectionList.find(
      (collection) =>
        collection.rno.toString() === code.toString() &&
        collection.ME.toString() === values.time.toString() &&
        collection.userid.toString() === selectedEmp.toString()
    );

    if (collection) {
      setValues((prev) => ({
        ...prev,
        cname: collection.cname,
        sample: collection.SampleNo,
        liters: collection.Litres,
        rcName: collection.rcName,
        userid: collection.userid,
      }));
    } else {
      setValues((prev) => ({
        ...prev,
        sample: "",
        cname: "",
        liters: "",
        rcName: "",
      })); // Clear cname if not found
    }
  };

  // Effect to search for customer when code changes

  useEffect(() => {
    if (!values.code && values.sample) {
      const handler = setTimeout(() => {
        findCustomerBySample(values.sample);
        findmilkCollByCode(values.code);
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [values.sample]);

  useEffect(() => {
    if (!values.sample && values.code) {
      const handler = setTimeout(() => {
        findCustomerByCode(values.code);
        findmilkCollByCode(values.code);
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [values.code]);

  //Handling Collection Notification

  // const sendNotifications = () => {
  //   const title = "Milk Collection Receipt";
  //   const body = {
  //     name: values.cname,
  //     date: values.date,
  //     fat: values.fat,
  //     snf: values.snf,
  //     liters: values.liters,
  //     rate: values.rate,
  //     amount: values.amt,
  //   };

  //   // Ensure token is available before dispatching
  //   if (!token) {
  //     console.error("Device token is missing");
  //     return;
  //   }

  //   // Dispatch with a single payload object
  //   dispatch(
  //     sendNewNotification({
  //       title, // Notification title
  //       body, // Notification body details
  //       deviceToken: token, // Device token for the notification
  //     })
  //   );
  // };

  // ------------------------------------------------------------------------------------------->

  // Send Milk Collection Whatsapp Message ----------------------------------------------------->
  const datetime = `${values.date}_${values.shift === 0 ? "सकाळ" : "सायंकाळ"}`;
  
  const sendMessage = async () => {
    const requestBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `91${values.mobile}`,
      type: "template",
      template: {
        name: "completegadi_collection_marathi",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: values.cname },
              { type: "text", text: datetime },
              { type: "text", text: dairyname },
              { type: "text", text: values.code },
              { type: "text", text: values.liters },
              { type: "text", text: values.fat },
              { type: "text", text: values.snf },
              { type: "text", text: values.sample },
              { type: "text", text: sankalak || "--" },
              { type: "text", text: dairyphone },
            ],
          },
        ],
      },
    };

    try {
      const response = await axiosInstance.post("/send-message", requestBody);
      if (response?.data.success) {
        toast.success("Whatsapp message send successfully...");
        const smsData = {
          smsStatus: "Sent",
          mono: values.mobile,
          custCode: values.code,
          rNo: "8600",
          smsText: requestBody,
        };

        dispatch(saveMessage(smsData));
      }
    } catch (error) {
      toast.error("Error in whatsapp message sending...");
    }
  };

  // handle vehicle milk collection ------------------------------------------------------------>
  const handleCollection = async (e) => {
    e.preventDefault();
    // Validate fields before submission
    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      dispatch(updateMobileColl(values));

      setValues({
        date: new Date().toISOString().split("T")[0],
        code: "",
        time: values.time,
        liters: "",
        fat: "",
        snf: "",
        amt: "",
        degree: 0,
        rate: "",
        cname: "",
        acccode: "",
        rcName: "",
        sample: "",
      });
      setErrors({}); // Reset errors
      // await sendNotifications();
      toast.success(`Milk Collection saved successfully!`);
      if (
        settings?.whsms !== undefined &&
        settings?.cmillcoll !== undefined &&
        settings.whsms === 1 &&
        settings.cmillcoll === 1
      ) {
        if (values.mobile.length === 10 && values.mobile !== "0000000000") {
          sendMessage();
        } else {
          toast.warn("Mobile number is not valid, message not sent!");
        }
      }
      smapleRef.current.focus();
    } catch (error) {
      console.error("Error sending milk entries to backend:", error);
    }
  };

  // Handling Download excel ------------------------------------------------------------------->
  const downloadExcel = async () => {
    dispatch(completedMilkSankalan({ date: values.date, time: values.time }));
    if (completedcolldata) {
      const handler = setTimeout(() => {
        exportToExcel();
      }, 800);
      return () => clearTimeout(handler);
    }
  };

  // >>>>> Excel ----
  const exportToExcel = () => {
    if (!completedcolldata || completedcolldata.length === 0) {
      toast.error("No data available to export!");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(
      completedcolldata.map((row, i) => ({
        Date: row.ReceiptDate.slice(0, 10),
        Time: row.ME,
        Code: row.rno,
        Liters: row.Litres,
        Fat: row.fat,
        SNF: row.snf,
        Name: row.cname,
        "Rate/Liter (₹)": row.rate,
        "Amount (₹)": row.Amt,
        Animal: row.CB,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Milk Collection");
    XLSX.writeFile(workbook, "milk-collection-report.xlsx");
  };

  return (
    <div className="complete-mobile-milk-container w100 h1 d-flex-col center">
      <form
        onSubmit={handleCollection}
        className="complete-mobile-milk-coll w60 h90 d-flex-col center bg p10"
      >
        <span className="page-heading heading w100 h10 t-center">
          {t("m-complete-coll")}
        </span>
        <div className="form-date-div w100 h10 d-flex a-center j-start px10 my10 sb">
          <div className="select-mobile-collector-div w40 d-flex a-center sb">
            <label htmlFor="date" className="info-text w30">
              {t("common:c-date")} <span className="req">*</span>
            </label>
            <input
              className={`data w70 ${errors.date ? "input-error" : ""}`}
              type="date"
              required
              placeholder="0000"
              name="date"
              id="date"
              onChange={handleInputs}
              value={values.date || ""}
              max={values.date}
            />
          </div>
          <div className="setting-btn-switch w15 j-center d-flex">
            <button
              type="button"
              onClick={handleTime}
              className={`sakalan-time text ${time ? "on" : "off"}`}
            >
              {time ? `${t("common:c-mrg")}` : `${t("common:c-eve")}`}
            </button>
          </div>
          <div className="select-mobile-collector-div w40 d-flex sb">
            <select
              className="data w100 h50"
              id="milk-collector"
              name="userid"
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
            >
              <option value="">-{t("m-select-coll")}-</option>
              {milkCollectors.map((emp, i) => (
                <option key={i} value={emp.emp_mobile}>
                  {emp.emp_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="user-details w100 h20 d-flex">
          <div className="form-div w30 px10">
            <label htmlFor="sample" className="info-text ">
              {t("m-sample-no")} <span className="req">*</span>{" "}
            </label>
            <input
              className={`data ${errors.sample ? "input-error" : ""}`}
              type="number"
              required
              placeholder="00"
              name="sample"
              id="sample"
              value={values.sample}
              disabled={!selectedEmp}
              onChange={handleInputs}
              onKeyDown={(e) => handleKeyDown(e, fatRef)}
              ref={smapleRef}
            />
          </div>
          <div className="form-div w20 px10">
            <label htmlFor="code" className="info-text">
              {t("m-cust-code")} <span className="req">*</span>{" "}
            </label>
            <input
              className={`data ${errors.code ? "input-error" : ""}`}
              type="number"
              placeholder="0000"
              name="code"
              id="code"
              value={values.code}
              disabled={!selectedEmp}
              onChange={handleInputs}
              onKeyDown={(e) => handleKeyDown(e, fatRef)}
            />
          </div>
          <div className="form-div w50 px10">
            <label htmlFor="cname" className="info-text">
              {t("m-cust-name")} <span className="req">*</span>{" "}
            </label>
            <input
              className={`data ${errors.cname ? "input-error" : ""}`}
              type="text"
              required
              placeholder={`${t("m-cust-name")}`}
              name="cname"
              id="cname"
              value={values.cname}
              readOnly
            />
          </div>
        </div>
        <div className="milk-details-div w100 h60 d-flex">
          <div className="milk-info w50 h1 d-flex-col ">
            <div className="form-div px10">
              <label htmlFor="liters" className="info-text">
                {t("common:c-liters")} <span className="req">*</span>{" "}
              </label>
              <input
                className={`data ${errors.liters ? "input-error" : ""}`}
                type="number"
                required
                placeholder="00.0"
                name="liters"
                id="liters"
                onChange={handleInputs}
                value={values.liters}
                readOnly
              />
            </div>
            <div className="form-div  px10">
              <label htmlFor="fat" className="info-text">
                {t("common:c-fat")} <span className="req">*</span>{" "}
              </label>
              <input
                className={`data ${errors.fat ? "input-error" : ""}`}
                type="number"
                required
                placeholder="0.0"
                name="fat"
                id="fat"
                step="any"
                onChange={handleInputChange}
                value={values.fat}
                disabled={!values.code}
                onKeyDown={(e) => handleKeyDown(e, snfRef)}
                ref={fatRef}
              />
            </div>
            <div className="form-div px10">
              <label htmlFor="snf" className="info-text">
                {t("common:c-snf")} <span className="req">*</span>{" "}
              </label>
              <input
                className={`data ${errors.snf ? "input-error" : ""}`}
                type="number"
                required
                placeholder="00.0"
                name="snf"
                id="snf"
                step="any"
                value={values.snf}
                disabled={!values.fat || !values.code}
                onChange={handleInputChange}
                ref={snfRef}
              />
            </div>
          </div>
          <div className="milk-info w50 h1 d-flex-col">
            <div className="form-div px10">
              <label htmlFor="degree" className="info-text">
                {t("common:c-deg")} <span className="req">*</span>{" "}
              </label>
              <input
                className={`data ${errors.degree ? "input-error" : ""}`}
                type="number"
                required
                disabled
                placeholder="00.0"
                name="degree"
                id="degree"
                value={values.degree}
                onChange={handleInputs}
              />
            </div>
            <div className="form-div px10">
              <label htmlFor="rate" className="info-text">
                {t("common:c-rate")} <span className="req">*</span>{" "}
              </label>
              <input
                className={`data ${errors.rate ? "input-error" : ""}`}
                type="number"
                required
                readOnly
                placeholder="00.0"
                name="rate"
                id="rate"
                value={values.rate}
              />
            </div>
            <div className="form-div px10">
              <label htmlFor="amt" className="info-text">
                {t("common:c-amt")} <span className="req">*</span>{" "}
              </label>
              <input
                className={`data ${errors.amt ? "input-error" : ""}`}
                type="number"
                required
                readOnly
                placeholder="00.0"
                name="amt"
                id="amt"
                value={values.amt}
              />
            </div>
          </div>
        </div>
        <div className="form-btns w100 h10 d-flex a-center j-end">
          <button
            type="button"
            className="w-btn  label-text mx10"
            onClick={downloadExcel}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Generating..." : "Excel"}
          </button>
          <button className="w-btn  label-text" type="reset">
            {t("m-btn-cancel")}
          </button>
          <button className="w-btn label-text mx10" type="submit">
            {t("m-btn-save")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteMilkColl;
