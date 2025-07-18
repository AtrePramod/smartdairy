// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import axiosInstance from "../../../../../../../App/axiosInstance";
import { MdAddShoppingCart, MdDeleteOutline } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import * as XLSX from "xlsx";
import Spinner from "../../../../../../Home/Spinner/Spinner";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaDownload } from "react-icons/fa6";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import { TbSortAscending2, TbSortDescending2 } from "react-icons/tb";

const MedList = () => {
  const { t } = useTranslation(["puchasesale", "common"]);
  const [date1, SetDate1] = useState("");
  const [date2, SetDate2] = useState("");
  const [fcode, setFcode] = useState("");
  const [purchaseList, setPurchaseList] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [sortKey, setSortKey] = useState("purchasedate");
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [filteredPurchaseList, setfilteredPurchaseList] =
    useState(purchaseList);
  const [viewItems, setViewItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const dairyInfo = useSelector(
    (state) =>
      state.dairy.dairyData.marathi_name ||
      state.dairy.dairyData.SocietyName ||
      state.dairy.dairyData.center_name
  );

  const role = useSelector((state) => state.users.user?.role);
  const [userRole, setUserRole] = useState(role);

  useEffect(() => {
    setUserRole(role);
  }, [role]);

  //download Excel sheet
  const downloadExcel = () => {
    const exportData = filteredPurchaseList.map((sale) => ({
      BillDate: formatDateToDDMMYYYY(sale.purchasedate),
      BillNo: sale.receiptno,
      DealerCode: sale.dealerCode,
      DealerName: sale.dealerName,
      ItemCode: sale.itemcode,
      ItemName: sale.itemname,
      Qty: sale.qty,
      Rate: sale.rate,
      Amt: sale.Amount,
      cgst: sale.cgst || 0,
      sgst: sale.sgst || 0,
      cn: sale.cn || 0,
    }));

    if (!Array.isArray(exportData) || exportData.length === 0) {
      alert("No data available to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData); // Convert sales data to Excel sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1"); // Add sheet to workbook
    XLSX.writeFile(workbook, `${date1}_to_${date2}.xlsx`); // Trigger download as .xlsx file
  };

  // Fetch purchase list from API
  useEffect(() => {
    const fetchPurchaseList = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(
          `/purchase/all?cn=1&ItemGroupCode=2&role=${userRole}`
        );
        let purchase = response?.data?.purchaseData || [];
        purchase.sort(
          (a, b) => new Date(b.purchasedate) - new Date(a.purchasedate)
        );
        setPurchaseList(purchase);
        setLoading(false);
      } catch (error) {
        toast.error("Error fetching purchase list.");
        setLoading(false);
      }
    };
    fetchPurchaseList();
  }, []);

  //set to date of range to  get default data
  useEffect(() => {
    SetDate1(getPreviousDate(0));
    SetDate2(getTodaysDate());
  }, []);
  //get today day
  const getTodaysDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };
  //get previous date with give to number
  const getPreviousDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split("T")[0];
  };

  // Function to fetch purchase data based on date and dealer code filt
  const handleShowbutton = async () => {
    setLoading(true);
    const getItem = {
      date1,
      date2,
    };
    // console.log(getItem);
    try {
      const queryParams = new URLSearchParams(getItem).toString();
      const { data } = await axiosInstance.get(
        `/purchase/all?cn=1&ItemGroupCode=2&role=${userRole}&${queryParams}`
      );
      // console.log(data);
      if (data?.success) {
        setPurchaseList(data.purchaseData || []);
        setFcode("");
      } else {
        setPurchaseList([]);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Error fetching Purchase list");
      setPurchaseList([]);
    }
  };

  // Function to delete a purchase item
  const handleDelete = async (id) => {
    // Show the confirmation dialog
    const result = await Swal.fire({
      title: "Confirm Deletion?",
      text: "Are you sure you want to delete this Bill?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        // Delete the item using axios
        const res = await axiosInstance.delete(`/purchase/delete/${id}`);
        toast.success(res?.data?.message);

        // Remove the deleted item from the list
        setPurchaseList((prevItems) =>
          prevItems.filter((item) => item.billno !== id)
        );

        // Show success message
        Swal.fire({
          title: "Deleted!",
          text: "Item deleted successfully.",
          icon: "success",
        });
      } catch (error) {
        // Handle error in deletion
        toast.error("Error deleting purchase item.");
      }
    }
  };

  //get date like DD/MM/YYYY formate
  const formatDateToDDMMYYYY = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Group purchase by bill number
  const groupPurchases = () => {
    const groupedPurchase = (filteredPurchaseList || []).reduce((acc, item) => {
      const key = item.billno;
      if (!acc[key]) {
        acc[key] = { ...item, TotalAmount: 0, TotalQty: 0 };
      }
      acc[key].TotalAmount += item.amount;
      acc[key].TotalQty += item.qty;
      return acc;
    }, {});

    return Object.values(groupedPurchase).sort((a, b) => {
      if (sortKey === "purchasedate") {
        return sortOrder === "asc"
          ? new Date(a.purchasedate) - new Date(b.purchasedate)
          : new Date(b.purchasedate) - new Date(a.purchasedate);
      } else {
        return sortOrder === "asc"
          ? a[sortKey] > b[sortKey]
            ? 1
            : -1
          : a[sortKey] < b[sortKey]
          ? 1
          : -1;
      }
    });
  };
  // ---------------------------------------------------------------------------->
  // Toggle sorting order ------------------------------------------------------->
  const handleSort = (key) => {
    setSortKey(key);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const groupedPurchaseArray = groupPurchases();

  //for searching Name /code to get the purchase list ------------------------------------------->
  useEffect(() => {
    if (fcode) {
      const filteredItems = purchaseList.filter(
        (item) =>
          item.dealerCode.toString().includes(fcode) ||
          item.dealerName.toLowerCase().includes(fcode.toLowerCase()) ||
          item.receiptno.toString().includes(fcode.toLowerCase())
      );
      setfilteredPurchaseList(filteredItems);
    } else {
      setfilteredPurchaseList(purchaseList);
    }
  }, [fcode, purchaseList]);

  const handleView = (billno) => {
    const filterList = purchaseList.filter((item) => item.billno === billno);
    setViewItems(filterList);
    // console.log(filterList);
    setIsInvoiceOpen(true);
  };

  //download PDF
  const downloadPdf = () => {
    if (groupedPurchaseArray.length === 0) {
      toast.warn("No data available to export.");
      return;
    }

    const doc = new jsPDF();

    // Define columns and rows
    const columns = [
      "Sr.No",
      "Date",
      "Bill No",
      "Dealer Code",
      "Dealer Name",
      "Qty",
      "Amount",
    ];
    const rows = groupedPurchaseArray.map((item, index) => [
      index + 1,
      formatDateToDDMMYYYY(item.purchasedate),
      item.receiptno,
      item.dealerCode,
      item.dealerName,
      item.TotalQty,
      item.TotalAmount,
    ]);
    const totalAmount = groupedPurchaseArray.reduce(
      (acc, item) => acc + item.TotalAmount,
      0
    );
    const totalQty = groupedPurchaseArray.reduce(
      (acc, item) => acc + item.TotalQty,
      0
    );
    // Page width for centering text
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Define the margin and the height of the box
    const margin = 10;
    const boxHeight = pageHeight - 20; // Adjust as needed

    // Add border for the entire content
    doc.rect(margin, margin, pageWidth - 2 * margin, boxHeight);

    // Add dairy name with border inside the box
    const dairyName = dairyInfo;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const dairyTextWidth = doc.getTextWidth(dairyName);
    doc.text(dairyName, (pageWidth - dairyTextWidth) / 2, margin + 15);

    // Add "Sale-Info" heading with border
    doc.setFontSize(14);
    const invoiceInfo = doc.getTextWidth("Return-Info");
    doc.text("Return-Info", (pageWidth - invoiceInfo) / 2, margin + 25);
    const gepInfo = doc.getTextWidth("Medicince Dealer Return Report");
    doc.text(
      "Medicince Dealer Return Report",
      (pageWidth - gepInfo) / 2,
      margin + 35
    );
    // Add table for items with borders and centered text
    doc.autoTable({
      head: [columns],
      body: rows,
      startY: margin + 45,
      margin: { top: 10 },
      styles: {
        cellPadding: 2,
        fontSize: 11,
        halign: "center", // Horizontal alignment for cells (centered)
        valign: "middle", // Vertical alignment for cells (centered)
        lineWidth: 0.08, // Line width for the borders
        lineColor: [0, 0, 0], // Black border color
      },
      headStyles: {
        fontSize: 12,
        fontStyle: "bold",
        fillColor: [225, 225, 225], // Light gray background for the header
        textColor: [0, 0, 0], // Black text color for header
      },
      tableLineColor: [0, 0, 0], // Table border color (black)
      tableLineWidth: 0.1, // Border width
    });

    // Add total amount with border
    doc.text(
      `Total Qty: ${totalQty}     Total Amount: ${totalAmount}`,
      75,
      doc.lastAutoTable.finalY + 10
    );

    // Save the PDF
    doc.save(
      `Medicince_Dealer_Return_Report_${formatDateToDDMMYYYY(
        date1
      )}_to_${formatDateToDDMMYYYY(date2)}.pdf`
    );
  };
  return (
    <div className="dealer-return-list-container w100 h1 d-flex-col">
      <span className="heading">व्यापारी औषधे परत :</span>
      <div className="download-print-pdf-excel-container w100 h25 d-flex-col sb">
        <div className="sales-dates-and-add-return-container w100 h50 d-flex a-center sb">
          <div className="sales-dates-container w65 d-flex a-center sb">
            <div className="date-input-div w40 d-flex a-center sb">
              <label htmlFor="" className="label-text w30">
                {t("ps-from")} :
              </label>
              <input
                type="date"
                className="data w70"
                value={date1}
                onChange={(e) => SetDate1(e.target.value)}
                max={date2}
              />
            </div>
            <div className="date-input-div w40 d-flex a-center sb">
              <label htmlFor="" className="label-text w30">
                {t("ps-to")} :
              </label>
              <input
                type="date"
                className="data w70"
                value={date2}
                onChange={(e) => SetDate2(e.target.value)}
                min={date1}
              />
            </div>
            <button className="w-btn" onClick={handleShowbutton}>
              {t("ps-show")}
            </button>
          </div>
          <div className="add-new-return-div w30 d-flex h1 sb center  bg p10">
            <label htmlFor="" className="label-text   ">
              {t("व्यापारी परत औषधे")}
            </label>
            <NavLink
              className="w-btn add-btn d-flex"
              style={{ textDecoration: "none" }}
              to="add-deal-return"
            >
              <MdAddShoppingCart className="icon f-label" />
              {t("ps-new")}
            </NavLink>
          </div>
        </div>
        <div className="find-returns-by-customer-container w100 h50 d-flex a-center">
          <input
            type="text"
            className="data w40"
            name="code"
            onFocus={(e) => e.target.select()}
            value={fcode}
            onChange={(e) =>
              setFcode(e.target.value.replace(/[^a-zA-Z0-9 ]/g, ""))
            }
            min="0"
            title="Enter code or name to search details"
            placeholder={`${t("ps-search")}`}
          />
          <button className="w15 btn mx10" onClick={downloadExcel}>
            <span className="f-label-text px10"> {t("ps-down-excel")}</span>
            <FaDownload />
          </button>
          <button className="w15 btn" onClick={downloadPdf}>
            <span className="f-label-text px10">PDF</span>
            <FaDownload />
          </button>
        </div>
      </div>
      <div className="dealer-return-prod-list-container w100 h70 d-flex-col hidescrollbar bg">
        <span className="heading p10">{t("ps-dealRetrnRep")} :</span>
        <div className="dealer-returns-prod-detilas-table-div w100 h1 mh100 d-flex-col hidescrollbar">
          <div className="data-headings-div w100 p10 d-flex a-center t-center sb sticky-top bg7">
            <span className="f-info-text w15">
              {t("ps-date")}
              <span
                className="px5 f-color-icon"
                type="button"
                onClick={() => handleSort("purchasedate")}
              >
                {sortKey === "purchasedate" ? (
                  sortOrder === "asc" ? (
                    <TbSortAscending2 />
                  ) : (
                    <TbSortDescending2 />
                  )
                ) : (
                  <TbSortAscending2 />
                )}
              </span>
            </span>
            <span className="f-info-text w10">{t("ps-rect-no")}</span>
            <span className="f-info-text w15">
              {t("ps-code")}
              <span
                className="px5 f-color-icon"
                type="button"
                onClick={() => handleSort("dealerCode")}
              >
                {sortKey === "dealerCode" ? (
                  sortOrder === "asc" ? (
                    <TbSortAscending2 />
                  ) : (
                    <TbSortDescending2 />
                  )
                ) : (
                  <TbSortAscending2 />
                )}
              </span>
            </span>
            <span className="f-info-text w40">
              {t("ps-dealer-name")}
              <span
                className="px5 f-color-icon"
                type="button"
                onClick={() => handleSort("dealerName")}
              >
                {sortKey === "dealerName" ? (
                  sortOrder === "asc" ? (
                    <TbSortAscending2 />
                  ) : (
                    <TbSortDescending2 />
                  )
                ) : (
                  <TbSortAscending2 />
                )}
              </span>
            </span>
            <span className="f-info-text w10">{t("ps-ttl-amt")}</span>
            <span className="f-info-text w10">Actions</span>

            {/* {userRole === "salesman" ? (
              <></>
            ) : (
              <>
                <span className="f-info-text w15">
                  {t("CreatedBy")}
                  <span
                    className="px5 f-color-icon"
                    type="button"
                    onClick={() => handleSort("createdby")}
                  >
                    {sortKey === "createdby" ? (
                      sortOrder === "asc" ? (
                        <TbSortAscending2 />
                      ) : (
                        <TbSortDescending2 />
                      )
                    ) : (
                      <TbSortAscending2 />
                    )}
                  </span>
                </span>
              </>
            )} */}
          </div>
          {loading ? (
            <Spinner />
          ) : groupedPurchaseArray.length > 0 ? (
            groupedPurchaseArray.map((item, index) => (
              <div
                key={index}
                className={`data-values-div sale-data-values-div w100 p10 d-flex center t-center sa`}
                style={{
                  backgroundColor: index % 2 === 0 ? "#faefe3" : "#fff",
                }}
              >
                <span className="text w15">
                  {formatDateToDDMMYYYY(item.purchasedate)}
                </span>
                <span className="text w10">{item.receiptno}</span>
                <span className="text w15">{item.dealerCode}</span>
                <span className="text w40">{item.dealerName}</span>

                <span className="text w10">{item.TotalAmount}</span>

                <span className="text w10 d-flex j-center a-center">
                  <button
                    className="px5"
                    onClick={() => handleView(item?.billno)}
                    title="View the Bill"
                  >
                    {t("ps-view")}
                  </button>
                  <MdDeleteOutline
                    onClick={() => handleDelete(item?.billno)}
                    size={15}
                    className="table-icon "
                    title="Delete the Bill"
                    style={{ color: "red" }}
                  />
                </span>
                {/* {userRole === "salesman" ? (
                  <></>
                ) : (
                  <>
                    <span className="text w15">
                      {item.createdby || "Unknown"}
                    </span>
                  </>
                )} */}
              </div>
            ))
          ) : (
            <div className="d-flex h1 center">{t("common:c-no-data-avai")}</div>
          )}
        </div>
      </div>
      {/* show invoice */}
      {isInvoiceOpen && viewItems.length > 0 && (
        <div className=" returnModal">
          <div className="modal-content">
            <div className="d-flex sb deal-info">
              <h2> {t("ps-InvoiceDetails")}</h2>
              <IoClose
                style={{ cursor: "pointer" }}
                className="icon"
                onClick={() => setIsInvoiceOpen(false)}
              />
            </div>
            <hr />
            <div className=" d-flex sb mx15 px15 deal-info-name">
              <h4>
                {" "}
                {t("ps-rect-no")} : {viewItems[0]?.receiptno || ""}
              </h4>
              <div className="10">
                {t("ps-date")} :
                {formatDateToDDMMYYYY(viewItems[0]?.purchasedate)}
              </div>
            </div>
            <div className=" d-flex sb mx15 px15 deal-info-name">
              <h4>
                {" "}
                {t("ps-code")} : {viewItems[0]?.dealerCode || ""}
              </h4>
              <h4 className="mx15">{viewItems[0]?.dealerName || ""}</h4>
            </div>
            <div className="sales-table-container w100">
              <table className="sales-table w100 ">
                <thead className="bg1">
                  <tr>
                    <th className="f-info-text"> {t("ps-srNo")}</th>
                    <th className="f-info-text"> {t("ps-itm-name")}</th>
                    <th className="f-info-text"> {t("ps-rate")}</th>
                    <th className="f-info-text"> {t("ps-qty")}</th>
                    <th className="f-info-text"> {t("ps-amt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {viewItems.map((item, i) => (
                    <tr key={i}>
                      <td className="info-text">{i + 1}</td>
                      <td className="info-text">{item.itemname}</td>
                      <td className="w15 info-text"> {item.rate}</td>

                      <td className="w15 info-text">{item.qty}</td>
                      <td className="info-text">{item.amount}</td>
                    </tr>
                  ))}
                  <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>
                      <b className="info-text"> {t("ps-ttl-amt")}</b>
                    </td>
                    <td className="info-text">
                      {(viewItems || []).reduce(
                        (acc, item) => acc + (item.amount || 0),
                        0
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedList;
