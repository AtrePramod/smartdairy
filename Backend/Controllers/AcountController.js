const pool = require("../Configs/Database");

//get all Voucher
exports.getAllVoucher = async (req, res) => {
  const { dairy_id, center_id } = req.user;
  const { autoCenter, VoucherDate, filter } = req.query;
  const autoCenterNumber = Number(autoCenter);
  const filterNumber = Number(filter);
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }
    // companyid; userid;VoucherNo; VoucherDate;// GLCode;// AccCode;// Amt;// Vtype;// InstrType;
    // BillNo;// ReceiptType;// ChequeNo;// BankCode;// ChequeDate;// OpId;// OffId;// ScrollNo;// BatchNo;// ReceiptNo;// Narration;// IsInterest;// Narration1;// vibhag;// createdby;// createdon;
    // updatedby;// updatedon;// pagetype;// cn;// ps;// isDeleted;// DeletedBy;// DeletedOn;// salebillno;
    // salebilldate;// center_id;

    let query = `SELECT * FROM tally_trnfile WHERE companyid = ? `;
    let queryParams = [dairy_id];

    if (autoCenterNumber === 1) {
      // If autoCenter is enabled, fetch only for the specific center
      query += " AND center_id = ?";
      queryParams.push(center_id);
    } else if (center_id > 0) {
      // If autoCenter is disabled, fetch items for both global (center_id = 0) and the specific center
      query += " AND (center_id = 0 OR center_id = ?)";
      queryParams.push(center_id);
    }

    if (filterNumber === 1) {
      query += " AND (Vtype=0 OR Vtype=3) "; // Only fetch  cash entry
    } else if (filterNumber === 2) {
      query += " AND (Vtype=1 OR Vtype=4) "; // Only fetch trasfer entry
    }
    if (VoucherDate) {
      query += " AND VoucherDate = ? ORDER BY id DESC";
      queryParams.push(VoucherDate);
    } else {
      query += " AND VoucherDate=CURDATE() ORDER BY id DESC ";
    }

    connection.query(query, queryParams, (err, result) => {
      connection.release();
      if (err) {
        console.error("Error executing query: ", err);
        return res
          .status(500)
          .json({ success: false, message: "Database query error" });
      }
      if (result.length === 0) {
        return res.status(201).json({
          success: true,
          message: "No found matching criteria!",
          voucherData: [],
        });
      }
      res.status(200).json({
        success: true,
        voucherData: result,
      });
    });
  });
};

//get all Voucher by grouping Accode and glcode
exports.getGroupedVoucher = async (req, res) => {
  const { dairy_id, center_id } = req.user;
  const { GLCode, autoCenter, VoucherDate } = req.query;
  const autoCenterNumber = Number(autoCenter);

  if (!GLCode || !VoucherDate) {
    return res.status(400).json({
      success: false,
      message: "GLCode and VoucherDate are required",
    });
  }

  // Calculate financial year start based on VoucherDate
  const voucherDateObj = new Date(VoucherDate);
  const year =
    voucherDateObj.getMonth() + 1 < 4
      ? voucherDateObj.getFullYear() - 1
      : voucherDateObj.getFullYear();
  const financialYearStart = `${year}-04-01`;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    let query = `SELECT AccCode,GLCode,center_id,SUM(Amt) AS totalamt FROM tally_trnfile WHERE companyid = ? `;

    let queryParams = [dairy_id];

    if (autoCenterNumber === 1 || center_id > 0) {
      query += " AND center_id = ?";
      queryParams.push(center_id);
    }

    query += " AND GLCode = ?";
    queryParams.push(GLCode);

    query += " AND VoucherDate BETWEEN ? AND ?";
    queryParams.push(financialYearStart, VoucherDate);

    query +=
      " AND Amt != 0 GROUP BY AccCode, GLCode, center_id ORDER BY AccCode ASC";

    connection.query(query, queryParams, (err, result) => {
      connection.release();
      if (err) {
        console.error("Query error:", err);
        return res.status(500).json({
          success: false,
          message: "Server query execution failed",
        });
      }
      res.status(200).json({ success: true, voucherList: result });
    });
  });
};
//get all Voucher by grouping Accode and glcode
exports.getGroupedStatement = async (req, res) => {
  const { dairy_id } = req.user;
  const {
    accCode,
    GLCode,
    autoCenter,
    center_id,
    fromVoucherDate,
    toVoucherDate,
  } = req.query;
  const autoCenterNumber = Number(autoCenter);

  if (!GLCode || !fromVoucherDate || !toVoucherDate || !accCode) {
    return res.status(400).json({
      success: false,
      message: "GLCode and Accocde and VoucherDate are required",
    });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    // Calculate opening balance for exactly one day before fromVoucherDate
    const openingBalanceQuery = `
      SELECT SUM(Amt) as openingBalance 
      FROM tally_trnfile 
      WHERE companyid = ? 
      AND GLCode = ? 
      AND AccCode = ? 
      AND VoucherDate = DATE_SUB(?, INTERVAL 1 DAY)
    `;

    const openingBalanceParams = [dairy_id, GLCode, accCode, fromVoucherDate];

    if (autoCenterNumber === 1 || center_id > 0) {
      openingBalanceQuery += " AND center_id = ?";
      openingBalanceParams.push(center_id);
    }

    // Main query for statement data
    let query = `SELECT * FROM tally_trnfile WHERE companyid = ? `;
    let queryParams = [dairy_id];

    if (autoCenterNumber === 1 || center_id > 0) {
      query += " AND center_id = ?";
      queryParams.push(center_id);
    }

    query += " AND GLCode = ? AND AccCode = ?";
    queryParams.push(GLCode, accCode);

    query += " AND VoucherDate BETWEEN ? AND ?";
    queryParams.push(fromVoucherDate, toVoucherDate);

    query += " ORDER BY VoucherDate ASC";

    // Execute opening balance query first
    connection.query(
      openingBalanceQuery,
      openingBalanceParams,
      (err, openingResult) => {
        if (err) {
          connection.release();
          console.error("Opening balance query error:", err);
          return res.status(500).json({
            success: false,
            message: "Server query execution failed",
          });
        }

        // Then execute main query
        connection.query(query, queryParams, (err, result) => {
          connection.release();
          if (err) {
            console.error("Query error:", err);
            return res.status(500).json({
              success: false,
              message: "Server query execution failed",
            });
          }

          res.status(200).json({
            success: true,
            openingBalance: openingResult[0]?.openingBalance || 0,
            statementData: result,
          });
        });
      }
    );
  });
};
//get all Voucher by grouping GLCode and VoucherDate
exports.getGeneralLedgerStatements = async (req, res) => {
  const { dairy_id } = req.user;
  const { GLCode, autoCenter, center_id, fromVoucherDate, toVoucherDate } =
    req.query;
  const autoCenterNumber = Number(autoCenter);

  if (!GLCode || !fromVoucherDate || !toVoucherDate) {
    return res.status(400).json({
      success: false,
      message: "GLCode and VoucherDate are required",
    });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    // Calculate opening balance for exactly one day before fromVoucherDate
    const openingBalanceQuery = `
      SELECT SUM(Amt) as openingBalance 
      FROM tally_trnfile 
      WHERE companyid = ? 
      AND GLCode = ? 
      AND VoucherDate < ?
    `;

    const openingBalanceParams = [dairy_id, GLCode, fromVoucherDate];

    if (autoCenterNumber === 1 || center_id > 0) {
      openingBalanceQuery += " AND center_id = ?";
      openingBalanceParams.push(center_id);
    }

    // Main query for statement data
    let query = `SELECT  VoucherDate,Vtype, SUM(Amt) as totalAmt 
                 FROM tally_trnfile 
                 WHERE companyid = ? `;
    let queryParams = [dairy_id];

    if (autoCenterNumber === 1 || center_id > 0) {
      query += " AND center_id = ?";
      queryParams.push(center_id);
    }

    query += " AND GLCode = ? ";
    queryParams.push(GLCode);

    query += " AND VoucherDate BETWEEN ? AND ?";
    queryParams.push(fromVoucherDate, toVoucherDate);

    query += " GROUP BY  VoucherDate, Vtype ORDER BY VoucherDate, Vtype ASC";

    // Execute opening balance query first
    connection.query(
      openingBalanceQuery,
      openingBalanceParams,
      (err, openingResult) => {
        if (err) {
          connection.release();
          console.error("Opening balance query error:", err);
          return res.status(500).json({
            success: false,
            message: "Server query execution failed",
          });
        }

        // Then execute main query
        connection.query(query, queryParams, (err, result) => {
          connection.release();
          if (err) {
            console.error("Query error:", err);
            return res.status(500).json({
              success: false,
              message: "Server query execution failed",
            });
          }
          const groupedData = result.reduce((acc, item) => {
            const key = `${item.VoucherDate} `;
            if (!acc[key]) {
              acc[key] = {
                VoucherDate: item.VoucherDate,
                naveAmt:
                  Number(item.Vtype) === 0 || Number(item.Vtype) === 1
                    ? Number(item.totalAmt)
                    : 0,
                jamaAmt:
                  Number(item.Vtype) === 4 || Number(item.Vtype) === 3
                    ? Number(item.totalAmt)
                    : 0,
              };
            } else {
              acc[key].naveAmt +=
                Number(item.Vtype) === 0 || Number(item.Vtype) === 1
                  ? Number(item.totalAmt)
                  : 0;
              acc[key].jamaAmt +=
                Number(item.Vtype) === 4 || Number(item.Vtype) === 3
                  ? Number(item.totalAmt)
                  : 0;
            }
            return acc;
          }, {});
          res.status(200).json({
            success: true,
            openingBalance: openingResult[0]?.openingBalance || 0,
            GLStatementData: Object.values(groupedData),
          });
        });
      }
    );
  });
};
//get all Voucher by grouping Accode and glcode
exports.getCheckTrn = async (req, res) => {
  const { dairy_id } = req.user;
  const { fromDate, toDate, cn, itemgrpcode, type, centerId } = req.query;

  if (!fromDate || !toDate || !itemgrpcode || !type) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection failed" });
    }

    glCodeQuery = `SELECT * FROM itemgroupmaster WHERE center_id = ? AND companyid = ? AND ItemGroupCode=? `;
    queryParams = [centerId, dairy_id, itemgrpcode];

    // Query for tally_trnfile
    let tallyQuery = `SELECT * FROM tally_trnfile WHERE companyid = ? and center_id=? AND VoucherDate BETWEEN ? AND ? AND cn = ? `;
    let tallyParams = [dairy_id, centerId, fromDate, toDate, cn];

    connection.query(glCodeQuery, queryParams, (err, result) => {
      if (err) {
        connection.release();
        console.error("Query error:", err);
        return res.status(500).json({
          success: false,
          message: "Server query execution failed",
        });
      }

      if (result.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: "Item group not found",
        });
      }

      if (Number(cn) === 0 && Number(type) === 1) {
        tallyQuery += ` AND GLCode = ? `;
        tallyParams.push(result[0].vikriUtpannaNo);
      } else if (Number(cn) === 1 && Number(type) === 1) {
        tallyQuery += ` AND GLCode = ? `;
        tallyParams.push(result[0].VikriYeneNo);
      } else if (Number(cn) === 2 && Number(type) === 1) {
        tallyQuery += ` AND GLCode = ? `;
        tallyParams.push(result[0].GhatnashakNo);
      } else if (Number(cn) === 0 && Number(type) === 2) {
        tallyQuery += ` AND GLCode = ? `;
        tallyParams.push(result[0].kharediDeneNo);
      } else if (Number(cn) === 1 && Number(type) === 2) {
        tallyQuery += ` AND GLCode = ? `;
        tallyParams.push(result[0].kharediKharchNo);
      } else if (Number(cn) === 2 && Number(type) === 2) {
        tallyQuery += ` AND GLCode = ? `;
        tallyParams.push("null");
      }

      connection.query(tallyQuery, tallyParams, (err, tallyResult) => {
        if (err) {
          connection.release();
          console.error("Query error:", err);
          return res.status(500).json({
            success: false,
            message: "Server query execution failed",
          });
        }

        let masterQuery = "";
        let masterParams = [dairy_id, fromDate, toDate, cn, itemgrpcode];

        if (Number(type) === 1) {
          masterQuery = ` SELECT * FROM salesmaster WHERE companyid = ? AND BillDate BETWEEN ? AND ? AND cn = ? AND ItemGroupCode = ? `;
        } else if (Number(type) === 2) {
          masterQuery = ` SELECT * FROM PurchaseMaster WHERE dairy_id = ? AND purchasedate BETWEEN ? AND ? AND cn = ? AND itemgroupcode = ? `;
        } else {
          connection.release();
          return res.status(400).json({
            success: false,
            message: "Invalid type provided",
          });
        }

        connection.query(masterQuery, masterParams, (err, masterResult) => {
          connection.release(); // Release connection after final query

          if (err) {
            console.error("Query error:", err);
            return res.status(500).json({
              success: false,
              message: "Server query execution failed",
            });
          }

          res.status(200).json({
            success: true,
            message: "Tally data fetched successfully",
            voucherList: tallyResult,
            dataList: masterResult,
          });
        });
      });
    });
  });
};

// Insert new voucher
exports.insertNewVoucher = async (req, res) => {
  const { center_id, ...voucherData } = req.body;
  const { dairy_id, user_id } = req.user;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    // Dynamically create the insert query
    const fields = Object.keys(voucherData).join(", ");
    const placeholders = Object.keys(voucherData)
      .map(() => "?")
      .join(", ");
    const values = Object.values(voucherData);

    const query = `INSERT INTO tally_trnfile (companyid, center_id, userid, ${fields}) VALUES (?, ?, ?, ${placeholders})`;
    const queryParams = [dairy_id, center_id, user_id, ...values];

    connection.query(query, queryParams, (err, result) => {
      connection.release();
      if (err) {
        console.error("Error executing query: ", err);
        return res
          .status(500)
          .json({ success: false, message: "Database query error" });
      }
      res.status(200).json({
        success: true,
        message: "Voucher inserted successfully!",
        result,
      });
    });
  });
};

// Insert many new vouchers
exports.manyNewVoucher = async (req, res) => {
  const { centerId, voucherList } = req.body; // Expecting an array of vouchers in voucherList
  const { dairy_id, user_id } = req.user;

  if (!Array.isArray(voucherList) || voucherList.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid or empty voucher list provided.",
    });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res
        .status(500)
        .json({ success: false, message: "Server connection failed" });
    }

    // Prepare the query for inserting multiple rows
    const fields = Object.keys(voucherList[0]).join(", ");
    const query = `INSERT INTO tally_trnfile (companyid, center_id, userid, ${fields}) VALUES ?`;

    // Prepare the values for all rows
    const values = voucherList.map((voucher) => [
      dairy_id,
      centerId,
      user_id,
      ...Object.values(voucher),
    ]);

    connection.query(query, [values], (err, result) => {
      connection.release();
      if (err) {
        console.error("Error executing query: ", err);
        return res
          .status(500)
          .json({ success: false, message: "server query failed" });
      }

      res.status(200).json({
        success: true,
        message: "Vouchers inserted successfully!",
        result,
      });
    });
  });
};

// Update voucher
exports.updateVoucher = async (req, res) => {
  const { id } = req.query;
  const { ...updateData } = req.body;
  const { dairy_id } = req.user;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    // Dynamically create the SET clause for the update query
    const fields = Object.keys(updateData)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = Object.values(updateData);

    // Create the dynamic query
    const query = `UPDATE tally_trnfile SET ${fields} WHERE id = ? AND companyid = ? `;
    const queryParams = [...values, id, dairy_id];

    connection.query(query, queryParams, (err, result) => {
      connection.release();
      if (err) {
        console.error("Error executing query: ", err);
        return res
          .status(500)
          .json({ success: false, message: "Database query error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "No record found to update!",
        });
      }
      res.status(200).json({
        success: true,
        message: "Voucher updated successfully!",
        result,
      });
    });
  });
};

// Delete voucher
exports.deleteVoucher = async (req, res) => {
  const { id } = req.query;
  const { dairy_id } = req.user;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res
        .status(500)
        .json({ success: false, message: "Server connection Failed" });
    }

    // Create the delete query
    const query = `DELETE FROM tally_trnfile WHERE id = ? AND companyid = ? `;
    const queryParams = [id, dairy_id];

    connection.query(query, queryParams, (err, result) => {
      connection.release();
      if (err) {
        console.error("Error executing query: ", err);
        return res
          .status(500)
          .json({ success: false, message: "Server query Failed" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "No record found to delete!",
        });
      }
      res.status(200).json({
        success: true,
        message: "Voucher deleted successfully!",
      });
    });
  });
};

//get balance
exports.generateBalance = async (req, res) => {
  const { autoCenter, VoucherDate, center_id } = req.query;
  const { dairy_id } = req.user;
  const autoCenterNumber = Number(autoCenter);
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    let query = `SELECT GLCode, AccCode, center_id, SUM(Amt) AS Amt FROM tally_trnfile WHERE companyid = ? `;
    const queryParams = [dairy_id];

    if (VoucherDate) {
      query += " AND VoucherDate <= ?";
      queryParams.push(VoucherDate);
    }
    if (autoCenterNumber === 1) {
      // If autoCenter is enabled, fetch only for the specific center
      query += " AND center_id = ?";
      queryParams.push(center_id);
    } else if (center_id > 0) {
      // If autoCenter is disabled, fetch items for both global (center_id = 0) and the specific center
      query += " AND (center_id = 0 OR center_id = ?)";
      queryParams.push(center_id);
    }

    query += " GROUP BY GLCode, AccCode, center_id";

    connection.query(query, queryParams, (err, result) => {
      connection.release();
      if (err) {
        console.error("Error executing query: ", err);
        return res
          .status(500)
          .json({ success: false, message: "Database query error" });
      }

      res.status(200).json({
        success: true,
        message: "Balance generated successfully",
        statementData: result || [],
      });
    });
  });
};
