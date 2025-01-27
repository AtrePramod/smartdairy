// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import { MdDeleteOutline } from "react-icons/md";
import axiosInstance from "../../../../App/axiosInstance";
import { useSelector } from "react-redux";

const CreateOthers = () => {
  const [cartItem, setCartItem] = useState([]);
  const [cname, setCname] = useState("");
  const [fcode, setFcode] = useState("");
  const [date, setDate] = useState("");
  const [itemList, setItemList] = useState([]);
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(0);
  const [selectitemcode, setSelectitemcode] = useState(0);
  const [amt, setAmt] = useState(0);
  const [rctno, setRctno] = useState(localStorage.getItem("receiptno") || 1);
  const customerslist = useSelector((state) => state.customer.customerlist);
  const [userid, setUserid] = useState("");
  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        const { data } = await axiosInstance.get("/item/all?ItemGroupCode=4");
        setItemList(data.itemsData || []);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
    fetchAllItems();
  }, []);

  useEffect(() => {
    setDate(getTodaysDate());
  }, []);

  useEffect(() => {
    if (customerslist.length > 0) {
      const customer = customerslist.find(
        (customer) => customer.srno === parseInt(fcode)
      );
      setCname(customer?.cname || "");
      setUserid(customer?.rno || "");
      // console.log(customer);
    } else {
      setCname("");
    }
  }, [fcode, customerslist]);

  useEffect(() => {
    setAmt(rate * qty);
  }, [rate, qty]);

  const getTodaysDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };
  const handleFindItemName = (id) => {
    const selectedItem = itemList.find((item) => item.ItemCode === id);
    return selectedItem.ItemName;
  };

  const handleAddToCart = () => {
    if (selectitemcode > 0 && qty > 0 && rate > 0) {
      const selectedItem = itemList.find(
        (item) => item.ItemCode === selectitemcode
      );
      const newCartItem = {
        companyid: selectedItem?.companyid,
        ReceiptNo: rctno, // Receipt No
        userid: userid,
        BillNo: "pramo1",
        ItemCode: selectedItem?.ItemCode,
        BillDate: date + " 00:00:00",
        Qty: qty,
        CustCode: fcode,
        ItemGroupCode: 4, // update Itemgroupcode
        Rate: rate,
        Amount: qty * rate,
      };

      // Update the cart items and log the updated array
      setCartItem((prev) => {
        const updatedCart = [...prev, newCartItem];
        // console.log("Updated Cart:", updatedCart); // Logs the latest state
        return updatedCart;
      });

      // Reset the input values
      setQty(1);
      setRate(0);
      setAmt(0);
      setSelectitemcode(0); // Reset amount to 0 after clearing rate and quantity
    }
  };
  const handleDeleteItem = (id) => {
    if (confirm("Are you sure you want to Delete?")) {
      const updatedCart = cartItem.filter((item, index) => index !== id);
      setCartItem(updatedCart);
    }
  };

  const handelClear = () => {
    setFcode("");
    setCartItem([]);
    setQty(1);
    setRate(0);
    setAmt(0);
    setSelectitemcode(0);
  };

  const handleSubmit = async () => {
    if (cartItem.length > 0) {
      try {
        const res = await axiosInstance.post("/sale/create", cartItem);
        if (res?.data?.success) {
          setFcode("");
          setCartItem([]);
          setQty(1);
          setRate(0);
          setAmt(0);
          setRctno(parseInt(rctno) + 1);
          setSelectitemcode(0);
          alert(res.data.message);
          localStorage.setItem("receiptno", parseInt(rctno) + 1);
        }
      } catch (error) {
        console.error("Error Submitting items:", error);
      }
    }
  };
  return (
    <div className="sale-add  w100">
      <div className="form bg">
        <span className="heading">Create Others</span>

        <div className="row">
          <div className="col">
            <label className="info-text px10">Date:</label>
            <input
              type="date"
              className="data"
              name="date"
              value={date}
              max={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>{" "}
          <div className="col">
            <label className="info-text px10">Receipt No:</label>
            <input
              type="number"
              name="number"
              value={rctno}
              className="data"
              onChange={(e) => setRctno(e.target.value.replace(/\D/, ""))}
              min="0"
            />
          </div>
        </div>
        <div className="row">
          <div className="col">
            <label className="info-text px10">Farmer Code:</label>
            <input
              type="number"
              name="code"
              className="data"
              value={fcode}
              onChange={(e) => setFcode(e.target.value.replace(/\D/, ""))}
              min="0"
            />
          </div>
          <div className="col">
            <label className="info-text px10">Farmer Name:</label>
            <input
              type="text"
              name="fname"
              className="data"
              value={cname}
              readOnly
            />
          </div>
        </div>
        <div className="row">
          <div className="col">
            <label className="info-text px10">Select Items:</label>
            {itemList.length > 0 && (
              <select
                disabled={!cname}
                value={selectitemcode}
                className="data"
                onChange={(e) => setSelectitemcode(parseInt(e.target.value))}
              >
                <option value="0">Select Item</option>
                {itemList.map((item, i) => (
                  <option key={i} value={item.ItemCode}>
                    {item.ItemName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="row">
          <div className="col">
            <label className="info-text px10">QTY:</label>
            <input
              disabled={!selectitemcode}
              type="number"
              value={qty}
              className="data"
              name="qty"
              min="1"
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value)))}
            />
          </div>
        </div>
        <div className="row w100  d-flex a-center">
          <div className="col">
            <label className="info-text px10">Rate:</label>
            <input
              type="number"
              name="rate"
              className="data"
              value={rate}
              onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value)))}
              min="0"
              disabled={!selectitemcode}
            />
          </div>
          <div className="col">
            <label className="info-text px10">Amount:</label>
            <input
              type="number"
              className="data"
              name="amount"
              value={amt}
              readOnly
            />
          </div>
        </div>
        <div className=" d-flex sa my15">
          <button className="w-btn" onClick={handleAddToCart}>
            Add to Cart
          </button>

          <button
            className="w-btn"
            onClick={handleSubmit}
            disabled={cartItem.length == 0}
          >
            Save
          </button>

          <button className="w-btn" onClick={handelClear}>
            Clear
          </button>
        </div>
      </div>
      <div className="for-table mx15 px10 w100">
        <div className="modal-content w100">
          <div className="header">
            <h2>Items List</h2>
          </div>

          <div className="sales-table-container w100">
            <table className="sales-table w100 ">
              <thead className="bg2">
                <tr>
                  <th>SrNo</th>
                  <th>Item Name</th>
                  <th>Rate</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cartItem.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{handleFindItemName(item.ItemCode)}</td>
                    <td>{item.Rate}</td>
                    <td>{item.Qty}</td>
                    <td>{item.Amount}</td>
                    <td>
                      <MdDeleteOutline
                        size={20}
                        className="table-icon"
                        style={{ color: "red" }}
                        onClick={() => handleDeleteItem(i)}
                      />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>
                    <b>Total</b>
                  </td>
                  <td>
                    {cartItem.reduce((acc, item) => acc + item.Amount, 0)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="w100 d-flex j-end  my10">
            <button className="w-btn">Print</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOthers;
