import React, { useRef, useEffect, useState, forwardRef } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useReactToPrint } from "react-to-print";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { BsCalendar3 } from "react-icons/bs";
import Spinner from "../../../Home/Spinner/Spinner";
import { generateMaster } from "../../../../App/Features/Customers/Date/masterdateSlice";
import { getAllMilkCollReport } from "../../../../App/Features/Mainapp/Milk/MilkCollectionSlice";
import "../../../../Styles/Mainapp/Reports/MilkReports/MilkReports.css";

const MilkcollectionReports = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation("common");
  const printRef = useRef();
  const date = useSelector((state) => state.date.toDate);
  const dairyinfo = useSelector((state) => state.dairy.dairyData);
  const data = useSelector((state) => state.milkCollection.allMilkColl);
  const status = useSelector((state) => state.milkCollection.allmilkstatus);
  const manualMaster = useSelector((state) => state.manualMasters.masterlist);
  const profile = useSelector((state) => state.userinfo.profile);
  const [filteredData, setFilteredData] = useState([]); // data to be displayed in ui
  const [collectionData, setCollectionData] = useState([]);
  const [summaryData, setSummaryData] = useState([]); // data to be displayed in ui for daswada report
  const [selectedCustomer, setSelectedCustomer] = useState(""); // Input for customer filtering
  const [selectedMilkType, setSelectedMilkType] = useState(""); // Added milk type filter
  const [customerName, setCustomerName] = useState(""); //.. State For customer name filter ...///
  const [selectedDay, setSelectedDay] = useState(""); //.......Days wise Milk Selection ....///
  const [isChecked, setIsChecked] = useState(false); // State to manage checkbox
  const [distinctDate, setdistinctDates] = useState("");
  const [selectedME, setSelectedME] = useState(null);
  const [sumreport, setSumreport] = useState(false); //...sum avravge sate
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [centerData, setCenterData] = useState([]); //..
  const centerList = useSelector((state) => state.center.centersList || []);

  useEffect(() => {
    setCollectionData(data);
  }, [data]);

  // ---------------------------------------------------->
  // Generate master dates based on the initial date ------------------------>
  useEffect(() => {
    dispatch(generateMaster(date));
  }, [date, dispatch]);

  // ------------------------------------------>
  // Handle the report dates selection ------------------>
  const handleSelectChange = async (e) => {
    const selectedIndex = e.target.value;
    if (selectedIndex !== "") {
      const selectedDates = manualMaster[selectedIndex];
      setSelectedDate(selectedDates);
      dispatch(
        getAllMilkCollReport({
          fromDate: selectedDates.start,
          toDate: selectedDates.end,
        })
      );
    }
  };

  // Handling fillter hide and show checkbox change ---------------------->
  const handleCheckboxChange = () => {
    setIsChecked((isChecked) => !isChecked);
  };

  // -------------------------------------------------->
  // Download pdf, excel and print functions------------------------->
  // >>>> PDF ----

  const [calculatedSummary, setCalculatedSummary] = useState({
    avgFat: 0,
    avgSNF: 0,
    avgRate: 0,
    totalLiters: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    if (summaryData && summaryData.length > 0) {
      const totalLiters = summaryData.reduce(
        (sum, item) => sum + parseFloat(item.Liters || 0),
        0
      );
      const totalAmount = summaryData.reduce(
        (sum, item) => sum + parseFloat(item.Amt || 0),
        0
      );
      const avgFat =
        summaryData.reduce(
          (sum, item) =>
            sum + parseFloat(item.fat || 0) * parseFloat(item.Liters || 0),
          0
        ) / totalLiters;
      const avgSNF =
        summaryData.reduce(
          (sum, item) =>
            sum + parseFloat(item.snf || 0) * parseFloat(item.Liters || 0),
          0
        ) / totalLiters;
      const avgRate = totalAmount / totalLiters;

      setCalculatedSummary({
        avgFat: avgFat.toFixed(2),
        avgSNF: avgSNF.toFixed(2),
        avgRate: avgRate.toFixed(2),
        totalLiters: totalLiters.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
      });
    }
  }, [summaryData]);

  function exportToPDF() {
    const dataToExport = sumreport ? summaryData : filteredData;

    if (!dataToExport || dataToExport.length === 0) {
      alert("No data available to export!");
      return;
    }

    const doc = new jsPDF();
    const formatDate = selectedDate;
    const fromDate = formatDate.start;
    const toDate = formatDate.end.slice(0, 10);

    const dairyName = dairyinfo.SocietyName.toUpperCase(); // Replace with actual dairy name
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add dairy name
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const dairyTextWidth = doc.getTextWidth(dairyName);
    const dairyXOffset = (pageWidth - dairyTextWidth) / 2; // Center align
    doc.text(dairyName, dairyXOffset, 10);

    // Add report name
    const reportName = sumreport
      ? "Milk Collection Summary Report"
      : "Milk Collection Detailed Report";
    doc.setFontSize(14);
    const reportTextWidth = doc.getTextWidth(reportName);
    const reportXOffset = (pageWidth - reportTextWidth) / 2; // Center align
    doc.text(reportName, reportXOffset, 20);

    // Add date range details
    const detailsText = `From: ${fromDate}  To: ${toDate}`;
    doc.setFontSize(12);
    const detailsTextWidth = doc.getTextWidth(detailsText);
    const detailsXOffset = (pageWidth - detailsTextWidth) / 2;
    doc.text(detailsText, detailsXOffset, 30);

    // Table configuration based on sumreport
    const tableColumn = sumreport
      ? ["Code", "Liters", "Fat", "Snf", "Name", "Rate", "Amount", "C/B"]
      : [
          "Date",
          "Shift",
          "Code",
          "Liters",
          "Fat",
          "Snf",
          "Name",
          "Rate",
          "Amount",
          "C/B",
        ];

    const tableRows = dataToExport.map((row) =>
      sumreport
        ? [
            row.code,
            row.Liters,
            row.avgFat || row.fat,
            row.avgSNF || row.snf,
            row.cname.toUpperCase(),
            row.avgRate || row.rate,
            row.totalAmt || row.Amt,
            row.CB === 0 ? "C" : "B",
          ]
        : [
            row.ReceiptDate.slice(0, 10),
            row.ME === 0 ? "M" : "E",
            row.rno,
            row.Litres,
            row.fat,
            row.snf,
            row.cname.toUpperCase(),
            row.rate,
            row.Amt,
            row.CB === 0 ? "C" : "B",
          ]
    );

    // Calculate total amount
    const totalAmount = sumreport
      ? calculateTotalAmountSummary(summaryData)
      : calculateTotalAmountFiltered(filteredData);

    // Add a row for the total amount
    const totalRow = sumreport
      ? ["", "", "", "", "Total", "", totalAmount.toFixed(2), ""]
      : ["", "", "", "", "", "", "Total", "", totalAmount.toFixed(2), ""];

    tableRows.push(totalRow);

    // Generate table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: {
        font: "helvetica",
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontSize: 8,
      },
      columnStyles: sumreport
        ? {
            0: { halign: "right" },
            1: { halign: "right" },
            2: { halign: "right" },
            3: { halign: "right" },
            4: { halign: "left" },
            5: { halign: "right" },
            6: { halign: "right" },
            7: { halign: "center" },
          }
        : {
            1: { halign: "center" },
            3: { halign: "right" },
            4: { halign: "right" },
            5: { halign: "right" },
            6: { halign: "left" },
            7: { halign: "right" },
            8: { halign: "right" },
            9: { halign: "center" },
          },
    });

    // Save the PDF
    doc.save(
      sumreport ? "MilkCollectionSummary.pdf" : "MilkCollectionDetails.pdf"
    );
  }

  // Function to calculate total amount for filtered data
  const calculateTotalAmountFiltered = (filteredData) => {
    return filteredData.reduce(
      (total, item) => total + parseFloat(item.Amt || 0),
      0
    );
  };

  // Function to calculate total amount for summary data
  const calculateTotalAmountSummary = (summaryData) => {
    return summaryData.reduce(
      (total, item) => total + parseFloat(item.Amt || 0),
      0
    );
  };

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert("No data available to export!");
      return;
    }

    // Check if selectedDate and selectedDate.end are valid
    const reportDate =
      selectedDay ||
      (selectedDate && selectedDate.end
        ? selectedDate.end.slice(0, 10)
        : "default-date");

    // Format date in DD/MM/YYYY format
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Get filtered data based on selected center
    const filteredDataForExport = getFilteredData(filteredData);

    // Check if filtered data is empty after applying the center filter
    if (filteredDataForExport.length === 0) {
      alert("No data available for the selected center!");
      return;
    }

    // Prepare data for export
    const worksheet = XLSX.utils.json_to_sheet(
      filteredDataForExport.map((row) => ({
        Date: formatDate(row.ReceiptDate),
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "sheet1");

    // Save the workbook with a dynamic file name based on the selected report date
    XLSX.writeFile(workbook, `milk-collection-report_${reportDate}.xlsx`);
  };

  const PrintComponent = forwardRef((props, ref) => {
    const componentRef = useRef();
    const handlePrint = useReactToPrint({
      content: () => componentRef.current,
    });
    //......const totalLiters = summaryData.reduce((sum, item) => sum + (item.Liters || 0), 0).toFixed(2);
    const totalAmount = summaryData
      .reduce((sum, item) => sum + (item.Amt || 0), 0)
      .toFixed(2);

    return (
      <div ref={componentRef}>
        <span className="heading">Milk Collection Report</span>
        <table border="1" className="w100 d-flex-col ">
          <thead>
            <tr>
              {sumreport ? (
                <>
                  <th className="w10 label-text">Code</th>
                  <th className="w10 label-text">Name</th>
                  <th className="w10 label-text">AVG Fat</th>
                  <th className="w10 label-text">AVG SNF</th>
                  <th className="w10 label-text">Liters</th>
                  <th className="w10 label-text">AVG Rate</th>
                  <th className="w10 label-text">Total Amount</th>
                  <th className="w10 label-text">C/B</th>
                </>
              ) : (
                <>
                  <th className="w10 label-text">Date</th>
                  <th className="w10 label-text">Session</th>
                  <th className="w10 label-text">Code</th>
                  <th className="w10 label-text">Name</th>
                  <th className="w10 label-text">Liters</th>
                  <th className="w10 label-text">Fat</th>
                  <th className="w10 label-text">SNF</th>
                  <th className="w10 label-text">Rate/Liter</th>
                  <th className="w10 label-text">Amount</th>
                  <th className="w10 label-text">C/B</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="w100 mh90 d-flex-col hidescrollbar">
            {props.data.map((row, index) => (
              <tr key={index}>
                {sumreport ? (
                  <>
                    <td className="w10 text">{row.code}</td>
                    <td className="w10 font">{row.cname}</td>
                    <td className="w10 font">{row.avgFat || row.fat}</td>
                    <td className="w10 font">{row.avgSNF || row.snf}</td>
                    <td className="w10 font">{row.Liters}</td>
                    <td className="w10 font">{row.avgRate || row.rate}</td>
                    <td className="w10 font">{row.totalAmt || row.Amt}</td>
                    <td className="w10 font">{row.CB === 0 ? "C" : "B"}</td>
                  </>
                ) : (
                  <>
                    <td className="w10 text">{formatDate(row.ReceiptDate)}</td>
                    <td className="w10 font">{row.ME === 0 ? "M" : "E"}</td>
                    <td className="w10 font">{row.rno}</td>
                    <td className="w10 font">{row.cname}</td>
                    <td className="w10 font">{row.Litres}</td>
                    <td className="w10 font">{row.fat}</td>
                    <td className="w10 font">{row.snf}</td>
                    <td className="w10 font">{row.rate}</td>
                    <td className="w10 font">{row.Amt}</td>
                    <td className="w10 font">{row.CB === 0 ? "C" : "B"}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  });

  function printReport() {
    const dataToExport = sumreport ? summaryData : filteredData;

    if (!dataToExport || dataToExport.length === 0) {
      alert("No data available to print!");
      return;
    }

    const formatDate = selectedDate;
    const fromDate = formatDate.start;
    const toDate = formatDate.end.slice(0, 10);

    const dairyName = dairyinfo.SocietyName.toUpperCase(); // Replace with actual dairy name
    const reportName = sumreport
      ? "Milk Collection Summary Report"
      : "Milk Collection Detailed Report";

    // Open a new window for printing
    const printWindow = window.open("", "_blank");

    // Generate report header HTML
    const headerHTML = `
    <html>
      <head>
        <title>${reportName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          h1 {
            text-align: center;
            font-size: 18px;
            color: black;
          }
          h2 {
            text-align: center;
            font-size: 14px;
          }
          p {
            text-align: center;
            font-size: 12px;
            color: black;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .left-align {
            text-align: left;
          }
          .right-align {
            text-align: right;
          }
          .center-text {
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h1>${dairyName}</h1>
        <h2>${reportName}</h2>
        <p>From: ${fromDate}  To: ${toDate}</p>
  `;

    // Create table headers and rows based on the report type
    const tableHeader = sumreport
      ? `
        <tr>
          <th>Code</th>
          <th>Liters</th>
          <th>Fat</th>
          <th>Snf</th>
          <th>Name</th>
          <th>Rate</th>
          <th>Amount</th>
          <th>C/B</th>
        </tr>
      `
      : `
        <tr>
          <th>Date</th>
          <th>Shift</th>
          <th>Code</th>
          <th>Liters</th>
          <th>Fat</th>
          <th>Snf</th>
          <th>Name</th>
          <th>Rate</th>
          <th>Amount</th>
          <th>C/B</th>
        </tr>
      `;

    const tableRows = dataToExport
      .map((row) => {
        return sumreport
          ? `
          <tr>
            <td>${row.code}</td>
            <td class="right-align">${row.Liters}</td>
            <td class="right-align">${row.avgFat || row.fat}</td>
            <td class="right-align">${row.avgSNF || row.snf}</td>
            <td class="left-align">${row.cname.toUpperCase()}</td>
            <td class="right-align">${row.avgRate || row.rate}</td>
            <td class="right-align">${row.totalAmt || row.Amt}</td>
            <td class="center-text">${row.CB === 0 ? "C" : "B"}</td>
          </tr>
        `
          : `
          <tr>
            <td>${row.ReceiptDate.slice(0, 10)}</td>
            <td class="center-text">${row.ME === 0 ? "M" : "E"}</td>
            <td>${row.rno}</td>
            <td class="right-align">${row.Litres}</td>
            <td class="right-align">${row.fat}</td>
            <td class="right-align">${row.snf}</td>
            <td class="left-align">${row.cname.toUpperCase()}</td>
            <td class="right-align">${row.rate}</td>
            <td class="right-align">${row.Amt.toFixed(2)}</td>
            <td class="center-text">${row.CB === 0 ? "C" : "B"}</td>
          </tr>
        `;
      })
      .join("");

    // Calculate the total amount
    const totalAmount = sumreport
      ? calculateTotalAmountSummary(summaryData)
      : calculateTotalAmountFiltered(filteredData);

    // Add a row for the total amount
    const totalRow = sumreport
      ? `
      <tr>
        <td colspan="6" class="right-align"><strong>Total</strong></td>
        <td class="right-align"><strong>${totalAmount.toFixed(2)}</strong></td>
        <td></td>
      </tr>
    `
      : `
      <tr>
        <td colspan="8" class="right-align"><strong>Total</strong></td>
        <td class="right-align"><strong>${totalAmount.toFixed(2)}</strong></td>
        <td></td>
      </tr>
    `;

    // Generate the final HTML for the table
    const tableHTML = `
    <table>
      <thead>
        ${tableHeader}
      </thead>
      <tbody>
        ${tableRows}
        ${totalRow}
      </tbody>
    </table>
  `;

    // Combine header, table, and footer HTML
    const finalHTML = headerHTML + tableHTML + "</body></html>";

    // Write the content to the print window
    printWindow.document.write(finalHTML);

    // Ensure the content is fully loaded before printing
    printWindow.document.close();
    printWindow.onload = function () {
      printWindow.print();
      printWindow.close();
    };
  }

  // Generating Daswada Reports ---------------------------------->

  const handleSumAvgChange = () => {
    setSumreport((prev) => !prev);
  };

  const aggregateCustomerData = (data) => {
    const customerData = data.reduce((acc, row) => {
      if (!acc[row.cname]) {
        acc[row.cname] = {
          code: row.rno,
          cname: row.cname,
          CB: row.CB,
          totalLiters: 0,
          totalFat: 0,
          totalSNF: 0,
          totalRate: 0,
          totalAmount: 0,
          count: 0, // To calculate averages
        };
      }
      // Aggregate values for the customer
      acc[row.cname].totalLiters += row.Litres;
      acc[row.cname].totalFat += row.fat;
      acc[row.cname].totalSNF += row.snf;
      acc[row.cname].totalRate += row.rate;
      acc[row.cname].totalAmount += row.Amt;
      acc[row.cname].count += 1;
      return acc;
    }, {});

    // Convert the object to an array and calculate averages
    return Object.values(customerData).map((customer) => ({
      code: customer.code,
      cname: customer.cname,
      CB: customer.CB,
      Liters: customer.totalLiters.toFixed(2),
      fat: (customer.totalFat / customer.count).toFixed(2),
      snf: (customer.totalSNF / customer.count).toFixed(2),
      rate: (customer.totalRate / customer.count).toFixed(2),
      Amt: customer.totalAmount.toFixed(2),
    }));
  };

  useEffect(() => {
    if (!sumreport) {
      setFilteredData(collectionData);
    } else {
      setSummaryData(aggregateCustomerData(centerData.milkData));
    }
  }, [sumreport, data]);

  // >>>>>>>---------------------->
  // Day filter ----

  useEffect(() => {
    const distinctDates = [
      ...new Set(data.map((item) => item.ReceiptDate.slice(0, 10))),
    ];
    setdistinctDates(distinctDates);
  }, [data]);

  useEffect(() => {
    setFilteredData(collectionData); // Initialize with the main data
  }, [collectionData]);

  // function to apply filters------------------>
  const applyFilters = () => {
    let data = collectionData;

    // Apply Customer Filter------------------>
    if (selectedCustomer) {
      data = data.filter((row) => row.rno.toString() === selectedCustomer);
    }

    // Apply Customer Name Filter------------------>
    if (customerName.trim()) {
      data = data.filter((row) =>
        row.cname.toLowerCase().includes(customerName.toLowerCase())
      );
    }

    // Apply Date Filter ------------------>
    if (selectedDay) {
      data = data.filter((row) => row.ReceiptDate.slice(0, 10) === selectedDay);
    }

    // Apply Milk Type Filter------------------>
    if (selectedMilkType === "0" || selectedMilkType === "1") {
      data = data.filter((row) => row.CB.toString() === selectedMilkType);
    }

    // Apply Shift Filter------------------>
    if (selectedME === "0" || selectedME === "1") {
      data = data.filter((row) => row.ME.toString() === selectedME);
    }

    setFilteredData(data);
  };

  // Reapply filters whenever any state changes
  useEffect(() => {
    applyFilters();
  }, [
    selectedCustomer,
    customerName,
    selectedDay,
    selectedMilkType,
    selectedME,
  ]);

  // Event Handlers
  const handleCustomerChange = (e) => setSelectedCustomer(e.target.value);
  const handleCustomerNameChange = (e) => setCustomerName(e.target.value);
  const handleDateChange = (e) => setSelectedDay(e.target.value);
  const handleMilkTypeChange = (e) => setSelectedMilkType(e.target.value);
  const handleShiftChange = (e) => setSelectedME(e.target.value);

  //...... centerwise data
  // Handle center change
  // Handle center selection change
  const handleCenterChange = (e) => {
    setSelectedCenterId(e.target.value); // Update selected center ID
  };

  // Filter data based on selected center
  const getFilteredData = (data) => {
    if (dairyinfo.center_id === 0) {
      if (!selectedCenterId) return data; // Return all data if no center is selected
      return data.filter(
        (item) => Number(item.center_id) === Number(selectedCenterId)
      ); // Filter by selected center ID
    } else if (dairyinfo.center_id > 0) {
      return data.filter(
        (item) => Number(item.center_id) === Number(dairyinfo.center_id)
      ); // Filter by dairyinfo center ID
    }
  };

  // Effect to update filtered data when selectedCenterId changes
  useEffect(() => {
    const filteredSummaryData = getFilteredData(summaryData);
    const filteredMilkData = getFilteredData(filteredData);

    // Update center data state with filtered data
    setCenterData({
      summaryData: filteredSummaryData,
      milkData: filteredMilkData,
    });
  }, [selectedCenterId, summaryData, filteredData]); // Re-run when selectedCenterId or data changes

  return (
    <>
      <div className="Milkcollection-container w100 h1 d-flex-col sb p10">
        <span className="heading px10"> दुध संकलन रिपोर्ट :</span>
        <div className="fillter-data-container w100 h30 d-flex-col">
          <div className="master-and-buttons-div w100 h30 d-flex sb">
            <div className="master-hide-show-chackbox-div w65 h1 d-flex sb">
              <div className="data custmize-report-div w60 h1 px10 d-flex a-center sb">
                <span className="cl-icon w20 h1 d-flex center info-text">
                  <BsCalendar3 />
                </span>
                <select
                  className="custom-select label-text w80 "
                  onChange={handleSelectChange}
                >
                  <option>--{t("c-select-master")}--</option>
                  {manualMaster.map((dates, index) => (
                    <option
                      className="label-text w100 d-flex  sa"
                      key={index}
                      value={index}
                    >
                      {new Date(dates.start).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short", // Abbreviated month format
                        year: "numeric",
                      })}
                      To :
                      {new Date(dates.end).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short", // Abbreviated month format
                        year: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="daswada-filter-container d-flex w35 a-center sa  ">
                <div className="milk-type-div w60 h1 d-flex a-center sb ">
                  <input
                    type="checkbox"
                    className="filter-check w30 h40"
                    onClick={handleSumAvgChange}
                  />
                  <span className="info-text w70">Daswada</span>
                </div>

                <div className="fillter-checkbox-container w60 h1 d-flex a-center">
                  <input
                    type="checkbox"
                    className="filter-check w30 h40"
                    onClick={handleCheckboxChange}
                  />
                  <span className="info-text w70">Filters</span>
                </div>
              </div>
            </div>
            <div className="download-option-btn-div w35 h1 d-flex j-center sa">
              <button className="w-btn text" onClick={printReport}>
                Print
              </button>
              <button className="w-btn text mx10" onClick={exportToPDF}>
                PDF
              </button>
              <button className="w-btn text" onClick={exportToExcel}>
                Excel
              </button>
            </div>
          </div>
          <div className="fitter-hide-show-container w100 h50 d-flex-col sa">
            {isChecked && (
              <div className="heided-conatiner-div w100 h1 d-flex-col sa">
                <div className="fillter-conditions-div w100 h50 d-flex a-center sb">
                  {profile.designation !== "milkcollector" ? (
                    <div className="centerwisee-data-show w40 h1 d-flex a-center ">
                      <span className="info-text w20">Center:</span>
                      <select
                        className="data w70 my10"
                        name="selection"
                        id="001"
                        onChange={handleCenterChange}
                      >
                        <option value="">All Centers</option>
                        {centerList &&
                          centerList.length > 0 &&
                          centerList.map((center, index) => {
                            if (dairyinfo.center_id === 0) {
                              return (
                                <option key={index} value={center.center_id}>
                                  {center.name || center.center_name}
                                </option>
                              );
                            } else if (
                              dairyinfo.center_id === center.center_id
                            ) {
                              return (
                                <option key={index} value={center.center_id}>
                                  {center.name || center.center_name}
                                </option>
                              );
                            } else {
                              return null;
                            }
                          })}
                      </select>
                    </div>
                  ) : null}

                  <div className="custmoer-number-no w45 h50 d-flex a-center px10 sb">
                    <label htmlFor="code" className="info-text w30">
                      Customer :
                    </label>
                    <div className="customer-name-customer-number-div w70 d-flex j-end sb">
                      <input
                        type="text"
                        className="w25 data"
                        name="code"
                        id="code"
                        onChange={handleCustomerChange}
                        placeholder="Code"
                      />
                      <input
                        type="text"
                        className="w70 data"
                        name="name"
                        id="name"
                        value={customerName}
                        onChange={handleCustomerNameChange}
                        placeholder=" Customer Name"
                      />
                    </div>
                  </div>
                </div>
                <div className="fillter-conditions-div1 w100 h50 d-flex sb">
                  <div className="days-selection-div w35 h1 d-flex a-center sb">
                    <label htmlFor="daywise" className="info-text w30">
                      Day wise :
                    </label>
                    {/* <div className="days-selection-input-div w70 d-flex j-end px10"> */}
                    <select
                      name="daywise"
                      id="daywise"
                      className="w50 data"
                      value={selectedDay}
                      onChange={handleDateChange}
                    >
                      <option value="">Select a Date</option>
                      {distinctDate.map((dates, index) => (
                        <option key={index} value={dates}>
                          {dates}
                        </option>
                      ))}
                    </select>
                    {/* </div> */}
                  </div>
                  <div className="filter-condition-divs w30  h1 d-flex a-center sb">
                    <label htmlFor="animal" className="info-text w40">
                      Milk Type :
                    </label>
                    <select
                      className="data w50"
                      name="animal"
                      id="animal"
                      onChange={handleMilkTypeChange}
                    >
                      <option className="text " value="2">
                        Cow-bufflow
                      </option>
                      <option className="text" value="0">
                        Cow
                      </option>
                      <option className="text" value="1">
                        Bufflow
                      </option>
                    </select>
                  </div>
                  <div className="filter-condition-divs w30 h1 d-flex a-center sb">
                    <label htmlFor="milktype" className="info-text w30">
                      Shift Wise :
                    </label>
                    <select
                      className="data w60"
                      name="milktype"
                      id="milktype"
                      onChange={handleShiftChange}
                    >
                      <option className="text" value="2">
                        Morning-Evening
                      </option>
                      <option className="text" value="0">
                        Morning
                      </option>
                      <option className="text" value="1">
                        Evening
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="Milk-collection-report-container w100 h60 d-flex-col bg">
          <span className="heading  px10">दुध संकलन</span>
          <div className="Milk-report-heading w100 h1 mh100 d-flex-col hidescrollbar">
            <div className="milkdata-headings-div w100 p10 d-flex center t-center sb sticky-top bg7">
              {sumreport ? (
                <>
                  <span className="w10 f-info-text">Code</span>
                  <span className="w25 f-info-text">Name</span>
                  <span className="w10 f-info-text">Liters</span>
                  <span className="w5 f-info-text">AVG FAT</span>
                  <span className="w5 f-info-text">AVG SNF</span>
                  <span className="w10 f-info-text">AVG Rate</span>
                  <span className="w10 f-info-text">Amount</span>
                  <span className="w10 f-info-text">C/B</span>
                </>
              ) : (
                <>
                  <span className="w10 f-label-text">Date</span>
                  <span className="w5 f-label-text">M/E</span>
                  <span className="w5 f-label-text">Code</span>
                  <span className="w25 f-label-text">Name</span>
                  <span className="w5 f-label-text">Liters</span>
                  <span className="w5 f-label-text">FAT</span>
                  <span className="w5 f-label-text">SNF</span>
                  <span className="w10 f-label-text">Rate/ltr</span>
                  <span className="w5 f-label-text">Amount</span>
                  <span className="w5 f-label-text">C/B</span>
                </>
              )}
            </div>

            {sumreport ? (
              <>
                {status === "loading" ? (
                  <Spinner />
                ) : summaryData && summaryData.length > 0 ? (
                  <>
                    {summaryData.map((customer, index) => (
                      <div
                        key={index}
                        className={`milkdata-div w100 p10 d-flex center t-center sa ${
                          index % 2 === 0 ? "bg-light" : "bg-dark"
                        }`}
                        style={{
                          backgroundColor: index % 2 === 0 ? "#faefe3" : "#fff",
                        }}
                      >
                        <span className="w10 text t-center">
                          {customer.code}
                        </span>
                        <span className="w25 text t-start">
                          {customer.cname}
                        </span>
                        <span className="w10 text t-center">
                          {customer.Liters}
                        </span>
                        <span className="w5 text t-center">{customer.fat}</span>
                        <span className="w5 text t-center">{customer.snf}</span>
                        <span className="w10 text t-center">
                          {customer.rate}
                        </span>
                        <span className="w10 text t-end">{customer.Amt}</span>
                        <span className="w10 text t-center">
                          {customer.CB === 0 ? "Cow" : "Buffalo"}
                        </span>
                      </div>
                    ))}

                    {/* Total Row */}
                    <div className="milkdata-div w100 h10 d-flex center t-center p10 sa bg7 br-bottom">
                      <span className="w10 text t-center font-bold">Total</span>
                      <span className="w25 text t-start"></span>

                      {/* Total Liters */}
                      <span className="w10 text t-center font-bold">
                        {summaryData
                          .reduce(
                            (sum, item) => sum + (parseFloat(item.Liters) || 0),
                            0
                          )
                          .toFixed(2)}
                      </span>

                      {/* Weighted Average FAT */}
                      <span className="w5 text t-center font-bold">
                        {(
                          summaryData.reduce(
                            (sum, item) =>
                              sum +
                              (parseFloat(item.fat) || 0) *
                                (parseFloat(item.Liters) || 0),
                            0
                          ) /
                          summaryData.reduce(
                            (sum, item) => sum + (parseFloat(item.Liters) || 0),
                            0
                          )
                        ).toFixed(2)}
                      </span>

                      {/* Weighted Average SNF */}
                      <span className="w5 text t-center font-bold">
                        {(
                          summaryData.reduce(
                            (sum, item) =>
                              sum +
                              (parseFloat(item.snf) || 0) *
                                (parseFloat(item.Liters) || 0),
                            0
                          ) /
                          summaryData.reduce(
                            (sum, item) => sum + (parseFloat(item.Liters) || 0),
                            0
                          )
                        ).toFixed(2)}
                      </span>

                      {/* ✅ Correct Average Rate */}
                      <span className="w10 text t-center font-bold">
                        {(
                          summaryData.reduce(
                            (sum, item) => sum + (parseFloat(item.Amt) || 0),
                            0
                          ) /
                          summaryData.reduce(
                            (sum, item) => sum + (parseFloat(item.Liters) || 0),
                            0
                          )
                        ).toFixed(2)}
                      </span>

                      {/* Total Amount */}
                      <span className="w10 text t-end font-bold">
                        {summaryData
                          .reduce(
                            (sum, item) => sum + (parseFloat(item.Amt) || 0),
                            0
                          )
                          .toFixed(2)}
                      </span>
                      <span className="w10 text t-center"></span>
                    </div>
                  </>
                ) : (
                  <div className="w100 h1 d-flex center">Data not found!</div>
                )}
              </>
            ) : (
              <>
                {status === "loading" ? (
                  <Spinner />
                ) : centerData.milkData && centerData.milkData.length > 0 ? (
                  <>
                    {centerData.milkData.map((customer, index) => (
                      <div
                        key={index}
                        className={`milkdata-div w100 p10 d-flex center t-center sa ${
                          index % 2 === 0 ? "bg-light" : "bg-dark"
                        }`}
                        style={{
                          backgroundColor: index % 2 === 0 ? "#faefe3" : "#fff",
                        }}
                      >
                        <span className="w10 text t-center">
                          {customer.ReceiptDate.slice(0, 10)}
                        </span>
                        <span className="w5 text t-center">
                          {customer.ME === 0 ? "Mrg" : "Eve"}
                        </span>
                        <span className="w5 text t-center">{customer.rno}</span>
                        <span className="w25 text t-start">
                          {customer.cname}
                        </span>
                        <span className="w5 text t-end">{customer.Litres}</span>
                        <span className="w5 text t-center">{customer.fat}</span>
                        <span className="w5 text t-center">{customer.snf}</span>
                        <span className="w10 text t-center">
                          {customer.rate}
                        </span>
                        <span className="w5 text t-end">{customer.Amt}</span>
                        <span className="w5 text t-center">
                          {customer.CB === 0 ? "COW" : "Buffalo"}
                        </span>
                      </div>
                    ))}

                    {/* Total Row */}

                    <div className="milkdata-div w100 h10 d-flex center t-center p10 sa bg7 br-bottom">
                      <span className="w10 f-label-text t-center">Total</span>
                      <span className="w5"></span>
                      <span className="w5"></span>
                      <span className="w25"></span>

                      {/* Total Litres */}
                      <span className="w5 text t-end font-bold">
                        {centerData.milkData
                          .reduce(
                            (sum, item) => sum + (parseFloat(item.Litres) || 0),
                            0
                          )
                          .toFixed(2)}
                      </span>

                      {/* Weighted Avg FAT */}
                      <span className="w5 text t-center font-bold">
                        {(
                          centerData.milkData.reduce(
                            (sum, item) =>
                              sum +
                              (parseFloat(item.fat) || 0) *
                                (parseFloat(item.Litres) || 0),
                            0
                          ) /
                          centerData.milkData.reduce(
                            (sum, item) => sum + (parseFloat(item.Litres) || 0),
                            0
                          )
                        ).toFixed(2)}
                      </span>

                      {/* Weighted Avg SNF */}
                      <span className="w5 text t-center font-bold">
                        {(
                          centerData.milkData.reduce(
                            (sum, item) =>
                              sum +
                              (parseFloat(item.snf) || 0) *
                                (parseFloat(item.Litres) || 0),
                            0
                          ) /
                          centerData.milkData.reduce(
                            (sum, item) => sum + (parseFloat(item.Litres) || 0),
                            0
                          )
                        ).toFixed(2)}
                      </span>

                      {/* ✅ Correct Average Rate */}
                      <span className="w10 text t-center font-bold">
                        {(
                          centerData.milkData.reduce(
                            (sum, item) => sum + (parseFloat(item.Amt) || 0),
                            0
                          ) /
                          centerData.milkData.reduce(
                            (sum, item) => sum + (parseFloat(item.Litres) || 0),
                            0
                          )
                        ).toFixed(2)}
                      </span>

                      {/* Total Amount */}
                      <span className="w5 text t-end font-bold">
                        {centerData.milkData
                          .reduce(
                            (sum, item) => sum + (parseFloat(item.Amt) || 0),
                            0
                          )
                          .toFixed(2)}
                      </span>
                      <span className="w5 text t-center"></span>
                    </div>
                  </>
                ) : (
                  <div className="w100 h1 d-flex center">Data not found!</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MilkcollectionReports;
