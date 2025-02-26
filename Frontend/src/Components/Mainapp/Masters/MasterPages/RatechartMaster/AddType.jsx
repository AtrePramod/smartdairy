import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addRcType, fetchMaxRctype } from "../../../../../App/Features/Mainapp/Masters/rateChartSlice";
import { toast } from "react-toastify";

const AddType = () => {
  const dispatch = useDispatch();
  const tDate = useSelector((state) => state.date.toDate);
  const status = useSelector((state) => state.ratechart.savercstatus);
  const maxRct = useSelector((state) => state.ratechart.maxRcType);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    rccode: "",
    rctype: "",
    time: 2,
    animal: 0,
  });

  // Update rccode when maxRct changes
  useEffect(() => {
    if (maxRct) {
      setFormData((prevData) => ({ ...prevData, rccode: maxRct }));
    }
  }, [maxRct]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateField = (name, value) => {
    let error = {};

    switch (name) {
      case "rctype":
        if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
          error[name] = "Invalid Ratechart Type.";
        } else {
          delete errors[name];
        }
        break;

      case "rccode":
      case "time":
      case "animalType":
        if (!/^\d$/.test(value.toString())) {
          errors[name] = `Invalid value of ${name}`;
        } else {
          delete errors[name];
        }
        break;
      case "rcdate":
        // Check if the value is in YYYY-MM-DD format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          errors[name] = `Invalid value of ${name}`;
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
    const fieldsToValidate = [
      "rccode",
      "rctype",
      "time",
      "animalType",
      "rcdate",
    ];
    const validationErrors = {};
    fieldsToValidate.forEach((field) => {
      const fieldError = validateField(field, formData[field]);
      Object.assign(validationErrors, fieldError);
    });
    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate fields before submission
    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Dispatch and wait for response
      const result = await dispatch(
        addRcType({
          rccode: parseInt(formData.rccode, 10),
          rctype: formData.rctype,
          time: parseInt(formData.time, 10),
          animal: formData.animalType,
        })
      ).unwrap(); // Ensure it returns success/failure properly
      // Show success message
      toast.success("Ratechart type added successfully!");

      // Fetch updated data
      dispatch(fetchMaxRctype());
      // Reset form
      setFormData({
        rccode: maxRct,
        rctype: "",
        time: "",
        animalType: "",
      });

      setRate([]);
    } catch (error) {
      // Show error message only if the request fails
      toast.error(`Failed to save ratechart: ${error || "Unknown error"}`);
    }
  };
  return (
    <div className="add-milk-type w100 h1 d-flex-col">
      <span className="heading">Add New Type : </span>
      <form
        onSubmit={handleSubmit}
        className="add-type-form-container w100 90 d-flex-col"
      >
        <div className="select-time-animal-type w100 my10 d-flex sb">
          <div className="select-time w25 h1 a-center d-flex ">
            <label htmlFor="rccode" className="info-text w100">
              No :
            </label>
            <input
              className="data w100 t-center"
              type="number"
              name="rccode"
              id="rccode"
              value={formData.rccode}
              onChange={handleInput}
              readOnly
            />
          </div>
          <div className="select-animal-type w70 h1 a-center d-flex">
            <label htmlFor="rctype" className="info-text w30">
              Type :
            </label>
            <input
              className={`data w100 ${errors.rctype ? "input-error" : ""}`}
              type="text"
              name="rctype"
              id="rctype"
              value={formData.rctype}
              onChange={handleInput}
            />
          </div>
        </div>
        <div className="select-time-animal-type w100 my10 d-flex sb">
          <div className="select-animal-type w50 h1 a-center d-flex">
            <label htmlFor="time" className="info-text w30">
              Time:
            </label>
            <select
              className={`data w60 ${errors.time ? "input-error" : ""}`}
              name="time"
              id="time"
              required
              value={formData.time}
              onChange={handleInput}
            >
              <option className="info-text" value="2">
                Both
              </option>
              <option className="info-text" value="0">
                Mornning
              </option>
              <option className="info-text" value="1">
                Evenning
              </option>
            </select>
          </div>
          <div className="select-animal-type w50 h1 a-center d-flex">
            <label htmlFor="animalType" className="info-text w50">
              Animal :
            </label>
            <select
              className="data w50 "
              name="animalType"
              id="animalType"
              required
              value={formData.animalType}
              onChange={handleInput}
            >
              <option className="info-text" value="0">
                Cow
              </option>
              <option className="info-text" value="1">
                Buffalo
              </option>
              <option className="info-text" value="2">
                Other
              </option>
            </select>
          </div>
        </div>
        <div className="button-div w100 h20 d-flex j-end">
          <button
            type="submit"
            className="btn mx10"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Adding..." : "Add Type"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddType;
