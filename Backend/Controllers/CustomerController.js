const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const pool = require("../Configs/Database");
dotenv.config({ path: "Backend/.env" });
const NodeCache = require("node-cache");
const cache = new NodeCache({});

//..................................................
// Create New Customer (Admin Route)................
//..................................................
// get max customer No -------------------------------------------------->
exports.getMaxCustNo = async (req, res) => {
  const dairy_id = req.user.dairy_id;
  const centerid = req.user.center_id;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const query =
        "SELECT MAX(srno) AS maxCustNo FROM customer WHERE orgid = ? AND centerid = ? AND ctype = 1";

      connection.query(query, [dairy_id, centerid], (error, results) => {
        // Release connection after query execution
        connection.release();

        if (error) {
          console.error("Error executing query: ", error);
          return res.status(500).json({ message: "Error executing query" });
        }

        // Fetching maxCustNo from results
        const maxCustNo = results[0]?.maxCustNo || 0; // Use maxCustNo instead of maxCid
        const cust_no = maxCustNo + 1;

        // Return the new customer number
        return res.status(200).json({ cust_no });
      });
    } catch (error) {
      connection.release();
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

exports.createCustomer = async (req, res) => {
  const {
    cust_name,
    isActive,
    isMember,
    date,
    prefix,
    cust_no,
    marathi_name,
    member_date,
    mobile,
    aadhaar_no,
    caste,
    gender,
    city,
    tehsil,
    district,
    pincode,
    milktype,
    rctype,
    farmerid,
    bankName,
    bank_ac,
    bankIFSC,
    deposit,
    commission,
    rebet,
    transportation,
    h_deposit,
    h_deduction,
    h_allrebet,
    h_sanghrebet,
    h_dairyrebet,
    h_transportation,
  } = req.body;

  const dairy_id = req.user.dairy_id;
  const centerid = req.user.center_id;
  const user_role = req.user.user_role;
  const designation = "Customer";
  const isAdmin = "0";
  const formattedCode = String(cust_no).padStart(3, "0");
  const fax = `${prefix}${formattedCode}`;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: "Error starting transaction" });
      }

      try {
        // Step 1: Get the max cid
        const maxCidQuery = `SELECT MAX(cid) AS maxCid FROM customer`;
        connection.query(maxCidQuery, (err, maxCidResult) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error querying maxCid: ", err);
              return res.status(500).json({ message: "Database query error" });
            });
          }

          const cid = (maxCidResult[0]?.maxCid || 0) + 1; // Calculate new cid

          // Step 2: Insert into customer table
          const createCustomerQuery = `
            INSERT INTO customer (
              cid, cname, Phone, fax, City, tal, dist, cust_accno, createdby, 
              createdon, mobile, isSabhasad, rno, orgid, engName, rcName, 
              centerid, srno, cust_pincode, cust_addhar, cust_farmerid, cust_bankname, 
              cust_ifsc, caste, gender, milktype, sabhasad_date, isActive, deposit, 
              commission, rebet, transportation, h_deposit, h_deduction, h_allrebet, 
              h_sanghrebet, h_dairyrebet, h_transportation , ctype , isdeleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          connection.query(
            createCustomerQuery,
            [
              cid,
              cust_name,
              mobile,
              fax,
              city,
              tehsil,
              district,
              bank_ac,
              user_role,
              date,
              mobile,
              isMember,
              fax,
              dairy_id,
              marathi_name,
              rctype || null,
              centerid,
              cust_no,
              pincode,
              aadhaar_no || null,
              farmerid || null,
              bankName || null,
              bankIFSC || null,
              caste || null,
              gender,
              milktype,
              member_date,
              isActive,
              deposit,
              commission,
              rebet,
              transportation,
              h_deposit,
              h_deduction,
              h_allrebet,
              h_sanghrebet,
              h_dairyrebet,
              h_transportation,
              1,
              0,
            ],
            (err, result) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Error inserting into customer table: ", err);
                  return res
                    .status(500)
                    .json({ message: "Database query error" });
                });
              }

              // Step 3: Insert into users table
              const createUserQuery = `
              INSERT INTO users (
                username, password, isAdmin, createdon, createdby, designation, 
                pincode, mobile, SocietyCode, pcode, center_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

              connection.query(
                createUserQuery,
                [
                  fax,
                  mobile,
                  isAdmin,
                  date,
                  user_role,
                  designation,
                  pincode,
                  mobile,
                  dairy_id,
                  cid,
                  centerid,
                ],
                (err, result) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Error inserting into users table: ", err);
                      return res
                        .status(500)
                        .json({ message: "Database query error" });
                    });
                  }

                  // Commit transaction after both inserts succeed
                  connection.commit((err) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error("Error committing transaction: ", err);
                        return res
                          .status(500)
                          .json({ message: "Error committing transaction" });
                      });
                    }

                    connection.release();
                    res
                      .status(200)
                      .json({ message: "Customer created successfully!" });
                  });
                }
              );
            }
          );
        });
      } catch (error) {
        connection.rollback(() => {
          connection.release();
          console.error("Error processing request: ", error);
          return res.status(500).json({ message: "Internal server error" });
        });
      }
    });
  });
};

//..................................................
// Update Customer Info (Admin Route) Active........
//..................................................

//....................admin.........................

exports.updateCustomer = async (req, res) => {
  const {
    cid,
    cust_name,
    isActive,
    isMember,
    marathi_name,
    member_date,
    mobile,
    aadhaar_no,
    caste,
    gender,
    city,
    tehsil,
    district,
    pincode,
    milktype,
    rctype,
    farmerid,
    bankName,
    bank_ac,
    bankIFSC,
    deposit,
    commission,
    rebet,
    transportation,
    h_deposit,
    h_deduction,
    h_allrebet,
    h_sanghrebet,
    h_dairyrebet,
    h_transportation,
  } = req.body;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const updateCustomerQuery = `
        UPDATE customer
        SET
           cname = ?, isActive = ?, isSabhasad = ?, engName = ?, sabhasad_date = ?, Phone = ?, cust_addhar = ?, caste = ?, gender = ?, City = ?, tal = ?, dist = ?, cust_pincode = ?, milktype = ?, rcName = ?, cust_farmerid = ?, cust_bankname = ?, cust_accno = ?, cust_ifsc = ?, deposit = ?, commission = ?, rebet = ?, transportation = ?, h_deposit = ?, h_deduction = ?, h_allrebet = ?, h_sanghrebet = ?, h_dairyrebet = ?, h_transportation = ?
        WHERE cid = ?
      `;

      connection.query(
        updateCustomerQuery,
        [
          cust_name,
          isActive,
          isMember,
          marathi_name,
          member_date,
          mobile,
          aadhaar_no,
          caste,
          gender,
          city,
          tehsil,
          district,
          pincode,
          milktype,
          rctype,
          farmerid,
          bankName,
          bank_ac,
          bankIFSC,
          deposit,
          commission,
          rebet,
          transportation,
          h_deposit,
          h_deduction,
          h_allrebet,
          h_sanghrebet,
          h_dairyrebet,
          h_transportation,
          cid,
        ],
        (error, results) => {
          connection.release(); // Release the connection back to the pool

          if (error) {
            console.error("Error executing query: ", error);
            return res.status(500).json({ message: "Error updating customer" });
          }

          if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Customer not found" });
          }

          return res
            .status(200)
            .json({ message: "Customer updated successfully" });
        }
      );
    } catch (error) {
      connection.release();
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

//..............................................................
//Fetch Customers List .........................................
//..............................................................

exports.customerList = async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const dairy_id = req.user.dairy_id;
      const center_id = req.user.center_id;
      // Check for unauthorized access
      if (!dairy_id) {
        connection.release();
        return res.status(400).json({ message: "Unauthorized User!" });
      }

      const getCustList = `
        SELECT cid, cname, Phone, fax, City, tal, dist, cust_accno, createdby,
               createdon, mobile, isSabhasad, rno, orgid, engName, rateChartNo,
               centerid, srno, cust_pincode, cust_addhar, cust_farmerid, cust_bankname,
               cust_ifsc, caste, gender, milktype, isActive, rcName
        FROM customer
        WHERE orgid = ? AND centerid = ? AND (ctype IS NULL OR ctype = 1) AND (isdeleted IS NULL OR isdeleted = 0)
      `;

      connection.query(getCustList, [dairy_id, center_id], (err, result) => {
        connection.release(); // Always release the connection after query execution

        if (err) {
          console.error("Error executing query: ", err); // Correct error reference
          return res
            .status(500)
            .json({ message: "Error fetching customer list" });
        }

        return res.status(200).json({
          customerList: result, // Return the entire result array
          message: "Customer list retrieved successfully", // Updated message
        });
      });
    } catch (error) {
      connection.release();
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

//..................................................
// Get list of unique RateCharts....................
//..................................................

exports.uniqueRchartList = async (req, res) => {
  const dairy_id = req.user.dairy_id;
  const center_id = req.user.center_id;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const geturcList = `
       SELECT DISTINCT rcName FROM customer WHERE orgid = ? AND centerid = ?
      `;

      connection.query(geturcList, [dairy_id, center_id], (err, result) => {
        connection.release(); // Release the connection back to the pool

        if (err) {
          console.error("Error executing query: ", err); // Correct error reference
          return res
            .status(500)
            .json({ message: "Error fetching customer list" });
        }

        return res.status(200).json({
          uniqueRCList: result,
          message: "Unique ratechart name list retrieved successfully",
        });
      });
    } catch (error) {
      connection.release();
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

//..................customer........................

//..................................................
// Delete Customer Info (Admin Route)...............
//..................................................

exports.deleteCustomer = async (req, res) => {
  const { cid } = req.body;
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }
    try {
      const isdeleted = "1";
      const udeletequery = `
        UPDATE customer
        SET
          isdeleted = ?,      
        WHERE cid = ?
      `;

      connection.query(udeletequery, [isdeleted, cid], (error, results) => {
        connection.release();

        if (error) {
          console.error("Error executing query: ", error);
          return res.status(500).json({ message: "Error deleting customer" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ message: "Customer not found" });
        }

        return res
          .status(200)
          .json({ message: "Customer deleted successfully" });
      });
    } catch (error) {
      connection.release();
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

//.................................................
// Customer Dashboard Info (Customer Route)........
//.................................................

exports.custDashboardInfo = async (req, res) => {
  const { toDate, fromDate } = req.body;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      // Get dairy_id from the verified token (already decoded in middleware)
      const dairy_id = req.user.dairy_id;
      const user_code = req.user.user_code;

      if (!dairy_id) {
        return res.status(400).json({ message: "Dairy ID not found!" });
      }

      const dairy_table = `dailymilkentry_${dairy_id}`;

      const custDashboardData = `     
        SELECT 
              ReceiptDate,
              SUM(Litres) AS dailyLiters,
              SUM(Amt) AS dailyAmount
          FROM ${dairy_table}
          WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?
          GROUP BY ReceiptDate WITH ROLLUP;
      `;

      connection.query(
        custDashboardData,
        [fromDate, toDate, user_code],
        (err, dashboardDataresult) => {
          connection.release();
          if (err) {
            console.error("Error executing summary query: ", err);
            return res.status(500).json({ message: "query execution error" });
          }
          const dashboardInfo = dashboardDataresult;
          res.status(200).json({ fromDate, toDate, dashboardInfo });
        }
      );
    } catch (error) {
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

// ---------------------------------------------------------------------->
// Upload customers from Excel ------------------------------------------>
// ---------------------------------------------------------------------->

//v2 function
// exports.uploadExcelCustomer = async (req, res) => {
//   const { data } = req.body;
//
//   const dairy_id = req.user.dairy_id;
//   const centerid = req.user.center_id;
//
//   pool.getConnection((err, connection) => {
//     if (err) {
//       console.error("Error getting MySQL connection: ", err);
//       return res.status(500).json({ message: "Database connection error" });
//     }
//     try {
//       const query =
//         "SELECT MAX(cid) AS maxCid FROM customer";
//
//       connection.query(query, [dairy_id, centerid], (error, results) => {
//         // Release connection after query execution
//         connection.release();
//
//
//
//       if (!user_id) {
//         return res.status(400).json({ message: "User ID not found!" });
//       }
//
//
//       const customerQuery = `
//         INSERT INTO customer (
//               cid, cname, Phone, fax, City, tal, dist, cust_accno, createdby,
//               createdon, mobile, isSabhasad, rno, orgid, engName,
//               centerid, srno, cust_pincode, cust_addhar, cust_farmerid, cust_bankname,
//               cust_ifsc, caste, gender, milktype
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//          `;
//
//       const values = data.map((row) => [
//         row.cust_name,
//         row.isActive,
//         row.isMember,
//         row.date,
//         row.prefix,
//         row.cust_no,
//         row.marathi_name,
//         row.member_date,
//         row.mobile,
//         row.aadhaar_no,
//         row.caste,
//         row.gender,
//         row.city,
//         row.tehsil,
//         row.district,
//         row.pincode,
//         row.milktype,
//         row.rctype,
//         row.farmerid,
//         row.bankName,
//         row.bank_ac,
//         row.bankIFSC,
//       ]);
//
//       connection.query(customerQuery, [values], (err, result) => {
//         connection.release();
//         if (err) {
//           console.error("Error executing summary query: ", err);
//           return res.status(500).json({ message: "Query execution error" });
//         }
//
//         res
//           .status(200)
//           .json({ message: "Customer successfully inserted from Excel file!" });
//       });
//     } catch (error) {
//       console.error("Error processing request: ", error);
//       return res.status(500).json({ message: "Internal server error" });
//     }
//   });
// };

// exports.uploadExcelCustomer = async (req, res) => {
//   const { excelData, prefix } = req.body;
//
//   const dairy_id = req.user.dairy_id;
//   const centerid = req.user.center_id;
//   const user_role = req.user.user_role;
//   const designation = "Customer";
//   const isAdmin = "0";
//   const fax = `${prefix}${cust_no}`;
//
//   pool.getConnection((err, connection) => {
//     if (err) {
//       console.error("Error getting MySQL connection: ", err);
//       return res.status(500).json({ message: "Database connection error" });
//     }
//
//     connection.beginTransaction((err) => {
//       if (err) {
//         connection.release();
//         return res.status(500).json({ message: "Error starting transaction" });
//       }
//
//       try {
//         // Step 1: Get the max cid
//         const maxCidQuery = `SELECT MAX(cid) AS maxCid FROM customer`;
//         connection.query(maxCidQuery, (err, maxCidResult) => {
//           if (err) {
//             return connection.rollback(() => {
//               connection.release();
//               console.error("Error querying maxCid: ", err);
//               return res.status(500).json({ message: "Database query error" });
//             });
//           }
//
//           const cid = (maxCidResult[0]?.maxCid || 0) + 1; // Calculate new cid
//
//           // Step 2: Insert into customer table
//           const createCustomerQuery = `
//             INSERT INTO customer (
//               cid, cname, Phone, fax, City, tal, dist, cust_accno, createdby,
//               createdon, mobile, isSabhasad, rno, orgid, engName,
//               centerid, srno, cust_pincode, cust_addhar, cust_farmerid, cust_bankname,
//               cust_ifsc, caste, gender, milktype
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//          `;
//
//           connection.query(
//             createCustomerQuery,
//             [
//               cid,
//               cust_name,
//               mobile,
//               fax,
//               city,
//               tehsil,
//               district,
//               bank_ac,
//               user_role,
//               date,
//               mobile,
//               isMember,
//               fax,
//               dairy_id,
//               marathi_name,
//               rctype || null,
//               centerid,
//               cust_no,
//               pincode,
//               aadhaar_no || null,
//               farmerid || null,
//               bankName || null,
//               bankIFSC || null,
//               caste || null,
//               gender,
//               milktype,
//               member_date,
//               isActive,
//             ],
//             (err, result) => {
//               if (err) {
//                 return connection.rollback(() => {
//                   connection.release();
//                   console.error("Error inserting into customer table: ", err);
//                   return res
//                     .status(500)
//                     .json({ message: "Database query error" });
//                 });
//               }
//
//               // Step 3: Insert into users table
//               const createUserQuery = `
//               INSERT INTO users (
//                 username, password, isAdmin, createdon, createdby, designation,
//                 pincode, mobile, SocietyCode, pcode, center_id
//               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `;
//
//               connection.query(
//                 createUserQuery,
//                 [
//                   fax,
//                   mobile,
//                   isAdmin,
//                   date,
//                   user_role,
//                   designation,
//                   pincode,
//                   mobile,
//                   dairy_id,
//                   cid,
//                   centerid,
//                 ],
//                 (err, result) => {
//                   if (err) {
//                     return connection.rollback(() => {
//                       connection.release();
//                       console.error("Error inserting into users table: ", err);
//                       return res
//                         .status(500)
//                         .json({ message: "Database query error" });
//                     });
//                   }
//
//                   // Commit transaction after both inserts succeed
//                   connection.commit((err) => {
//                     if (err) {
//                       return connection.rollback(() => {
//                         connection.release();
//                         console.error("Error committing transaction: ", err);
//                         return res
//                           .status(500)
//                           .json({ message: "Error committing transaction" });
//                       });
//                     }
//
//                     connection.release();
//                     res
//                       .status(200)
//                       .json({ message: "Customer created successfully!" });
//                   });
//                 }
//               );
//             }
//           );
//         });
//       } catch (error) {
//         connection.rollback(() => {
//           connection.release();
//           console.error("Error processing request: ", error);
//           return res.status(500).json({ message: "Internal server error" });
//         });
//       }
//     });
//   });
// };

exports.uploadExcelCustomer = async (req, res) => {
  const { excelData, prefix } = req.body;
  const dairy_id = req.user.dairy_id;
  const centerid = req.user.center_id;
  const user_role = req.user.user_role;
  const designation = "Customer";
  const isAdmin = "0";

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: "Error starting transaction" });
      }

      try {
        // Step 1: Get the max cid
        const maxCidQuery = `SELECT MAX(cid) AS maxCid FROM customer`;
        connection.query(maxCidQuery, (err, maxCidResult) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error querying maxCid: ", err);
              return res.status(500).json({ message: "Database query error" });
            });
          }

          const cid = maxCidResult[0]?.maxCid || 0; // Start from max cid

          // Step 2: Process each customer data
          const processCustomerData = (index) => {
            if (index >= excelData.length) {
              // If all customers processed, commit transaction
              return connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Error committing transaction: ", err);
                    return res
                      .status(500)
                      .json({ message: "Error committing transaction" });
                  });
                }
                connection.release();
                res
                  .status(200)
                  .json({ message: "Customers created successfully!" });
              });
            }

            const customer = excelData[index];
            const customerid = cid + 1; // Increment cid for each customer

            const {
              Code,
              Customer_Name,
              Marathi_Name,
              Mobile,
              Addhar_No,
              Farmer_Id,
              City,
              Tehsil,
              District,
              Pincode,
              Bank_Name,
              Bank_AccNo,
              Bank_IFSC,
              Caste,
              Gender,
              Animal_Type,
              Ratechart_Type,
            } = customer;

            const formattedCode = String(Code).padStart(3, "0");
            const fax = `${prefix}${formattedCode}`;
            const isMember = 0; // Assuming a default value; adjust as needed
            const member_date = new Date(); // Assuming current date; adjust as needed
            const isActive = 1; // Assuming active by default; adjust as needed
            const createdOn = new Date(); // Assuming current date for createdOn
            const animal = Animal_Type === "cow" ? "0" : "1";
            const createCustomerQuery = `
              INSERT INTO customer (
                cid, cname, Phone, fax, City, tal, dist, cust_accno, createdby,
                createdon, mobile, isSabhasad, rno, orgid, engName,
                centerid, srno, cust_pincode, cust_addhar, cust_farmerid, cust_bankname,
                cust_ifsc, caste, gender, milktype, sabhasad_date, isActive, rcName
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ? , ?)
            `;

            connection.query(
              createCustomerQuery,
              [
                customerid,
                Customer_Name,
                Mobile,
                fax,
                City,
                Tehsil,
                District,
                Bank_AccNo,
                user_role,
                createdOn,
                Mobile,
                isMember,
                fax,
                dairy_id,
                Marathi_Name,
                centerid,
                Code,
                Pincode,
                Addhar_No || null,
                Farmer_Id || null,
                Bank_Name || null,
                Bank_IFSC || null,
                Caste || null,
                Gender,
                animal || 0,
                member_date,
                isActive,
                Ratechart_Type || null,
              ],
              (err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Error inserting into customer table: ", err);
                    return res
                      .status(500)
                      .json({ message: "Database query error" });
                  });
                }

                const createUserQuery = `
                  INSERT INTO users (
                    username, password, isAdmin, createdon, createdby, designation,
                    pincode, mobile, SocietyCode, pcode, center_id
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                connection.query(
                  createUserQuery,
                  [
                    fax,
                    Mobile,
                    isAdmin,
                    createdOn,
                    user_role,
                    designation,
                    Pincode,
                    Mobile,
                    dairy_id,
                    cid,
                    centerid,
                  ],
                  (err) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error(
                          "Error inserting into users table: ",
                          err
                        );
                        return res
                          .status(500)
                          .json({ message: "Database query error" });
                      });
                    }

                    // Process the next customer
                    processCustomerData(index + 1);
                  }
                );
              }
            );
          };

          // Start processing customers from index 0
          processCustomerData(0);
        });
      } catch (error) {
        connection.rollback(() => {
          connection.release();
          console.error("Error processing request: ", error);
          return res.status(500).json({ message: "Internal server error" });
        });
      }
    });
  });
};

// exports.uploadExcelCustomer = async (req, res) => {
//   const { excelData, prefix } = req.body;
//
//   if (!Array.isArray(excelData) || excelData.length === 0) {
//     return res.status(400).json({ message: "Invalid or empty excelData" });
//   }
//   console.log(excelData);
//
//   const dairy_id = req.user.dairy_id;
//   const centerid = req.user.center_id;
//   const user_role = req.user.user_role;
//   const designation = "Customer";
//   const isAdmin = "0";
//
//   try {
//     const connection = await pool.getConnection();
//     await connection.beginTransaction();
//
//     const [maxCidResult] = await connection.query(
//       `SELECT MAX(cid) AS maxCid FROM customer`
//     );
//     const cid = maxCidResult[0]?.maxCid || 0;
//
//     for (let index = 0; index < excelData.length; index++) {
//       const customer = excelData[index];
//       const customerid = cid + index + 1;
//
//       const {
//         Code,
//         Customer_Name,
//         Marathi_Name,
//         Mobile,
//         Addhar_No,
//         Farmer_Id,
//         City,
//         Tehsil,
//         District,
//         Pincode,
//         Bank_Name,
//         Bank_AccNo,
//         Bank_IFSC,
//         Caste,
//         Gender,
//         Animal_Type,
//         Ratechart_Type,
//       } = customer;
//
//       const formattedCode = String(Code).padStart(3, "0");
//       const fax = `${prefix}${formattedCode}`;
//       const isMember = 0;
//       const member_date = new Date();
//       const isActive = 1;
//       const createdOn = new Date();
//       const animal = Animal_Type === "cow" ? "0" : "1";
//
//       await connection.query(
//         `
//         INSERT INTO customer (
//           cid, cname, Phone, fax, City, tal, dist, cust_accno, createdby,
//           createdon, mobile, isSabhasad, rno, orgid, engName,
//           centerid, srno, cust_pincode, cust_addhar, cust_farmerid, cust_bankname,
//           cust_ifsc, caste, gender, milktype, sabhasad_date, isActive, rcName
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `,
//         [
//           customerid,
//           Customer_Name,
//           Mobile,
//           fax,
//           City,
//           Tehsil,
//           District,
//           Bank_AccNo,
//           user_role,
//           createdOn,
//           Mobile,
//           isMember,
//           fax,
//           dairy_id,
//           Marathi_Name,
//           centerid,
//           Code,
//           Pincode,
//           Addhar_No || null,
//           Farmer_Id || null,
//           Bank_Name || null,
//           Bank_IFSC || null,
//           Caste || null,
//           Gender,
//           animal || 0,
//           member_date,
//           isActive,
//           Ratechart_Type || null,
//         ]
//       );
//
//       await connection.query(
//         `
//         INSERT INTO users (
//           username, password, isAdmin, createdon, createdby, designation,
//           pincode, mobile, SocietyCode, pcode, center_id
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `,
//         [
//           fax,
//           Mobile,
//           isAdmin,
//           createdOn,
//           user_role,
//           designation,
//           Pincode,
//           Mobile,
//           dairy_id,
//           cid,
//           centerid,
//         ]
//       );
//     }
//
//     await connection.commit();
//     res.status(200).json({ message: "Customers created successfully!" });
//   } catch (error) {
//     if (connection) {
//       await connection.rollback();
//       connection.release();
//     }
//     console.error("Error processing request: ", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// ---------------------------------------------------------------------->
// Profile Info --------------------------------------------------------->
// ---------------------------------------------------------------------->

//v2 function
exports.profileInfo = async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }
    try {
      const user_id = req.user.user_id;

      if (!user_id) {
        return res.status(400).json({ message: "User ID not found!" });
      }

      // Check if the profileInfo is already in the cache
      const cachedProfile = cache.get(`profile_${user_id}`);
      if (cachedProfile) {
        return res.status(200).json({ profileInfo: cachedProfile });
      }

      const profileInfoQuery = `SELECT cname, City, cust_pincode, mobile, cust_addhar, cust_farmerid, cust_bankname, cust_accno, cust_ifsc, srno FROM customer WHERE fax =?`;

      connection.query(profileInfoQuery, [user_id], (err, result) => {
        connection.release();
        if (err) {
          console.error("Error executing summary query: ", err);
          return res.status(500).json({ message: "Query execution error" });
        }
        const profileInfo = result[0];
        // Store the profileInfo in the cache with a unique key
        cache.set(`profile_${user_id}`, profileInfo);
        res.status(200).json({ profileInfo });
      });
    } catch (error) {
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

// ..................................................
// App Customer Milk Report..........................
// ..................................................

//exports.milkReport = async (req, res) => {
//   const { fromDate, toDate } = req.body;
//
//   pool.getConnection((err, connection) => {
//     if (err) {
//       console.error("Error getting MySQL connection: ", err);
//       return res.status(500).json({ message: "Database connection error" });
//     }
//
//     try {
//       const dairy_id = req.user.dairy_id;
//       const user_code = req.user.user_code;
//
//       if (!dairy_id) {
//         return res.status(400).json({ message: "Dairy ID not found!" });
//       }
//
//       const dairy_table = `dailymilkentry_${dairy_id}`;
//
//       // Proceed with the milk report query
//       const milkreportQuery = `
//         SELECT
//           ReceiptDate, ME, CB, Litres, fat, snf, Rate, Amt
//         FROM ${dairy_table}
//         WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?
//         ORDER BY ReceiptDate ASC;
//       `;
//
//       const summaryQuery = `
//         SELECT
//           SUM(Litres) AS totalLiters,
//           AVG(fat) AS avgFat,
//           AVG(snf) AS avgSNF,
//           AVG(Rate) AS avgRate,
//           SUM(Amt) AS totalAmount
//         FROM ${dairy_table}
//         WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?;
//       `;
//
//       connection.query(
//         milkreportQuery,
//         [fromDate, toDate, user_code],
//         (err, records) => {
//           if (err) {
//             connection.release();
//             console.error("Error executing records query: ", err);
//             return res.status(500).json({ message: "Query execution error" });
//           }
//
//           connection.query(
//             summaryQuery,
//             [fromDate, toDate, user_code],
//             (err, summaryResults) => {
//               connection.release();
//
//               if (err) {
//                 console.error("Error executing summary query: ", err);
//                 return res
//                   .status(500)
//                   .json({ message: "Summary query execution error" });
//               }
//
//               const summaryData = summaryResults[0];
//
//               res.status(200).json({ records: records, summary: summaryData });
//             }
//           );
//         }
//       );
//     } catch (error) {
//       console.error("Error processing request: ", error);
//       return res.status(500).json({ message: "Internal server error" });
//     }
//   });
// };

//new

// exports.milkReport = async (req, res) => {
//   const { fromDate, toDate } = req.body;
//
//   pool.getConnection((err, connection) => {
//     if (err) {
//       console.error("Error getting MySQL connection: ", err);
//       return res.status(500).json({ message: "Database connection error" });
//     }
//
//     try {
//       const dairy_id = req.user.dairy_id;
//       const user_code = req.user.user_code;
//
//       if (!dairy_id) {
//         connection.release();
//         return res.status(400).json({ message: "Dairy ID not found!" });
//       }
//
//       const dairy_table = `dailymilkentry_${dairy_id}`;
//
//       const combinedQuery = `
//         SELECT
//           ReceiptDate, ME, CB, Litres, fat, snf, Rate, Amt,
//           summary.totalLiters,
//           summary.avgFat,
//           summary.avgSNF,
//           summary.avgRate,
//           summary.totalAmount
//         FROM ${dairy_table}
//         JOIN (
//           SELECT
//             SUM(Litres) AS totalLiters,
//             AVG(fat) AS avgFat,
//             AVG(snf) AS avgSNF,
//             AVG(Rate) AS avgRate,
//             SUM(Amt) AS totalAmount
//           FROM ${dairy_table}
//           WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?
//         ) AS summary
//         WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?
//         ORDER BY ReceiptDate ASC;
//       `;
//
//       connection.query(
//         combinedQuery,
//         [fromDate, toDate, user_code, fromDate, toDate, user_code],
//         (err, results) => {
//           connection.release();
//
//           if (err) {
//             console.error("Error executing query: ", err);
//             return res.status(500).json({ message: "Query execution error" });
//           }
//
//           const summaryData = {
//             totalLiters: results[0].totalLiters,
//             avgFat: results[0].avgFat,
//             avgSNF: results[0].avgSNF,
//             avgRate: results[0].avgRate,
//             totalAmount: results[0].totalAmount,
//           };
//
//           res.status(200).json({ records: results, summary: summaryData });
//         }
//       );
//     } catch (error) {
//       console.error("Error processing request: ", error);
//       return res.status(500).json({ message: "Internal server error" });
//     }
//   });
// };

exports.milkcollReport = async (req, res) => {
  const { fromDate, toDate } = req.body;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const dairy_id = req.user.dairy_id;
      const user_code = req.user.user_code;

      if (!dairy_id) {
        connection.release();
        return res.status(400).json({ message: "Dairy ID not found!" });
      }

      const dairy_table = `dailymilkentry_${dairy_id}`;

      const milkcollDataQuery = `
          SELECT 
             ReceiptDate, ME, CB, Litres, fat, snf, Rate, Amt
          FROM ${dairy_table}
          WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?
        ORDER BY ReceiptDate ASC;
      `;

      connection.query(
        milkcollDataQuery,
        [fromDate, toDate, user_code],
        (err, result) => {
          connection.release();

          if (err) {
            console.error("Error executing query: ", err);
            return res.status(500).json({ message: "Query execution error" });
          }
          res.status(200).json({ records: result });
        }
      );
    } catch (error) {
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

// ..................................................
// App Custmize Milk Report..........................
// ..................................................

exports.customMilkReport = async (req, res) => {
  const { fromDate, toDate } = req.body;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const dairy_id = req.user.dairy_id;
      const user_code = req.user.user_code;

      if (!dairy_id) {
        return res.status(400).json({ message: "Dairy ID not found!" });
      }

      const dairy_table = `dailymilkentry_${dairy_id}`;

      const milkreportQuery = `
        SELECT 
          ReceiptDate, ME, CB, Litres, fat, snf, Rate, Amt,
          (SELECT 
            SUM(Litres) 
            FROM ${dairy_table} 
            WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?) AS totalLiters,
          (SELECT 
            AVG(fat) 
            FROM ${dairy_table} 
            WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?) AS avgFat,
          (SELECT 
            AVG(snf) 
            FROM ${dairy_table} 
            WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?) AS avgSNF,
          (SELECT 
            AVG(Rate) 
            FROM ${dairy_table} 
            WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?) AS avgRate,
          (SELECT 
            SUM(Amt) 
            FROM ${dairy_table} 
            WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?) AS totalAmount
        FROM ${dairy_table} 
        WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?
        ORDER BY ReceiptDate ASC;
      `;

      const params = [
        fromDate,
        toDate,
        user_code, // Params for totalLiters
        fromDate,
        toDate,
        user_code, // Params for avgFat
        fromDate,
        toDate,
        user_code, // Params for avgSNF
        fromDate,
        toDate,
        user_code, // Params for avgRate
        fromDate,
        toDate,
        user_code, // Params for totalAmount
        fromDate,
        toDate,
        user_code, // Params for main query
      ];

      connection.query(milkreportQuery, params, (err, results) => {
        connection.release();

        if (err) {
          console.error("Error executing milk report query: ", err);
          return res.status(500).json({ message: "Query execution error" });
        }

        const summaryData = {
          totalLiters: results[0]?.totalLiters || 0,
          avgFat: results[0]?.avgFat || 0,
          avgSNF: results[0]?.avgSNF || 0,
          avgRate: results[0]?.avgRate || 0,
          totalAmount: results[0]?.totalAmount || 0,
        };

        res.status(200).json({ records: results, summary: summaryData });
      });
    } catch (error) {
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

// ..................................................
// App Customer Milk Report..........................
// ..................................................

exports.custMilkReport = async (req, res) => {
  const { SocietyCode, AccCode } = req.body;

  const currentDate = new Date();
  const toDate = currentDate.toISOString().split("T")[0];

  const day = toDate.slice(8, 10);
  const date = toDate.slice(0, 8);
  let startDay = 0;
  if (day <= 10) {
    startDay = 1;
  } else if (day <= 20) {
    startDay = 11;
  } else {
    startDay = 21;
  }
  const fromDate = date + startDay;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const dairy_id = SocietyCode;
      const user_code = AccCode;

      if (!dairy_id) {
        return res.status(400).json({ message: "Dairy ID not found!" });
      }

      const dairy_table = `dailymilkentry_${dairy_id}`;

      // Proceed with the milk report query
      const milkreportQuery = `
        SELECT 
          ReceiptDate, ME, CB, Litres, fat, snf, Rate, Amt
        FROM ${dairy_table} 
        WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?
        ORDER BY ReceiptDate ASC;
      `;

      const summaryQuery = `
        SELECT 
          SUM(Litres) AS totalLiters,
          AVG(fat) AS avgFat,
          AVG(snf) AS avgSNF,
          AVG(Rate) AS avgRate,
          SUM(Amt) AS totalAmount
        FROM ${dairy_table}
        WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?;
      `;

      connection.query(
        milkreportQuery,
        [fromDate, toDate, user_code],
        (err, records) => {
          if (err) {
            connection.release();
            console.error("Error executing records query: ", err);
            return res.status(500).json({ message: "Query execution error" });
          }

          connection.query(
            summaryQuery,
            [fromDate, toDate, user_code],
            (err, summaryResults) => {
              connection.release();

              if (err) {
                console.error("Error executing summary query: ", err);
                return res
                  .status(500)
                  .json({ message: "Summary query execution error" });
              }

              const summaryData = summaryResults[0];

              res.status(200).json({ records: records, summary: summaryData });
            }
          );
        }
      );
    } catch (error) {
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

// ..................................................
// Download Customer List Upload Excel Format .......
// ..................................................

exports.downloadExcelFormat = async (req, res) => {
  const { SocietyCode, AccCode } = req.body;

  const currentDate = new Date();
  const toDate = currentDate.toISOString().split("T")[0];

  const day = toDate.slice(8, 10);
  const date = toDate.slice(0, 8);
  let startDay = 0;
  if (day <= 10) {
    startDay = 1;
  } else if (day <= 20) {
    startDay = 11;
  } else {
    startDay = 21;
  }
  const fromDate = date + startDay;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const dairy_id = SocietyCode;
      const user_code = AccCode;

      if (!dairy_id) {
        return res.status(400).json({ message: "Dairy ID not found!" });
      }

      const dairy_table = `dailymilkentry_${dairy_id}`;

      // Proceed with the milk report query
      const milkreportQuery = `
        SELECT 
          ReceiptDate, ME, CB, Litres, fat, snf, Rate, Amt
        FROM ${dairy_table} 
        WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?
        ORDER BY ReceiptDate ASC;
      `;

      const summaryQuery = `
        SELECT 
          SUM(Litres) AS totalLiters,
          AVG(fat) AS avgFat,
          AVG(snf) AS avgSNF,
          AVG(Rate) AS avgRate,
          SUM(Amt) AS totalAmount
        FROM ${dairy_table}
        WHERE ReceiptDate BETWEEN ? AND ? AND AccCode = ?;
      `;

      connection.query(
        milkreportQuery,
        [fromDate, toDate, user_code],
        (err, records) => {
          if (err) {
            connection.release();
            console.error("Error executing records query: ", err);
            return res.status(500).json({ message: "Query execution error" });
          }

          connection.query(
            summaryQuery,
            [fromDate, toDate, user_code],
            (err, summaryResults) => {
              connection.release();

              if (err) {
                console.error("Error executing summary query: ", err);
                return res
                  .status(500)
                  .json({ message: "Summary query execution error" });
              }

              const summaryData = summaryResults[0];

              res.status(200).json({ records: records, summary: summaryData });
            }
          );
        }
      );
    } catch (error) {
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

// -------------------------------------------------------------------------------------------->
// Dev Pramod ------------------------------------>
// -------------------------------------------------------------------------------------------->

//get max dealer no
exports.getMaxDealNo = async (req, res) => {
  const dairy_id = req.user.dairy_id;
  const centerid = req.user.center_id;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const query =
        "SELECT MAX(srno) AS maxCustNo FROM customer WHERE orgid = ? AND centerid = ? AND ctype=?";

      connection.query(query, [dairy_id, centerid, 2], (error, results) => {
        // Release connection after query execution
        connection.release();

        if (error) {
          console.error("Error executing query: ", error);
          return res.status(500).json({ message: "Error executing query" });
        }

        // Fetching maxCustNo from results
        const maxCustNo = results[0]?.maxCustNo || 0; // Use maxCustNo instead of maxCid
        const cust_no = maxCustNo + 1;

        // Return the new customer number
        return res.status(200).json({ cust_no });
      });
    } catch (error) {
      connection.release();
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

//create a new dealer controller -------------------------------------------------------------->
exports.createDealer = async (req, res) => {
  const {
    cust_name,
    cust_no,
    marathi_name,
    mobile,
    district,
    city,
    pincode,
    bankName,
    bank_ac,
    bankIFSC,
  } = req.body;

  const { dairy_id, center_id: centerid, user_role } = req.user;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Transaction start error:", err);
        return res.status(500).json({ message: "Error starting transaction" });
      }

      // Step 1: Get the next cid
      const maxCidQuery = "SELECT MAX(cid) AS maxCid FROM customer";
      connection.query(maxCidQuery, (err, maxCidResult) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("Error fetching maxCid:", err);
            return res.status(500).json({ message: "Database query error" });
          });
        }

        const cid = (maxCidResult[0]?.maxCid || 0) + 1;

        // Step 2: Insert into customer table
        const createDealerQuery = `
          INSERT INTO customer (
            cid, cname, Phone, City, dist, cust_accno, createdby, 
            createdon, mobile, orgid, engName, centerid, srno, 
            cust_pincode, cust_bankname, cust_ifsc, isActive, ctype , isdeleted
          ) VALUES (?, ?, ? ,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?)
        `;
        const dealerData = [
          cid,
          cust_name,
          mobile,
          city,
          district,
          bank_ac,
          user_role,
          new Date(),
          mobile,
          dairy_id,
          marathi_name,
          centerid,
          cust_no,
          pincode,
          bankName,
          bankIFSC,
          1,
          2,
          0,
        ];

        connection.query(createDealerQuery, dealerData, (err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error inserting dealer:", err);
              return res
                .status(500)
                .json({ message: "Error creating dealer record" });
            });
          }

          // Step 3: Fetch the newly created dealer
          const fetchCreatedDealerQuery =
            "SELECT * FROM customer WHERE cid = ?";
          connection.query(
            fetchCreatedDealerQuery,
            [cid],
            (err, dealerResult) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Error fetching created dealer:", err);
                  return res
                    .status(500)
                    .json({ message: "Error fetching dealer record" });
                });
              }

              // Step 4: Commit transaction
              connection.commit((commitErr) => {
                if (commitErr) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Error committing transaction:", commitErr);
                    return res
                      .status(500)
                      .json({ message: "Error committing transaction" });
                  });
                }

                // Success
                connection.release();
                res.status(200).json({
                  message: "Dealer created successfully!",
                  dealer: dealerResult[0],
                });
              });
            }
          );
        });
      });
    });
  });
};

//-------------------------------------------------------------------------------------------->
// create a new dealer controller ------------------------------------------------------------>
//-------------------------------------------------------------------------------------------->

exports.dealerList = async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const dairy_id = req.user.dairy_id;
      const center_id = req.user.center_id;
      // Check for unauthorized access
      if (!dairy_id) {
        connection.release();
        return res.status(400).json({ message: "Unauthorized User!" });
      }

      const getCustList = `
        SELECT * FROM customer
        WHERE orgid = ? AND centerid = ? AND ctype=2 AND (isdeleted IS NULL OR isdeleted != 1);
      `;

      connection.query(getCustList, [dairy_id, center_id], (err, result) => {
        connection.release(); // Always release the connection after query execution

        if (err) {
          console.error("Error executing query: ", err); // Correct error reference
          return res
            .status(500)
            .json({ message: "Error fetching customer list" });
        }

        return res.status(200).json({
          customerList: result, // Return the entire result array
          message: "Customer list retrieved successfully", // Updated message
        });
      });
    } catch (error) {
      connection.release();
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

// update delaer controller fun
exports.updateDealer = async (req, res) => {
  const { id, cname, Phone, City, cust_ifsc, dist, cust_accno } = req.body;

  const { dairy_id, center_id } = req.user;
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const updateDealerQuery = `
        UPDATE customer
        SET 
          cname = ?, 
          Phone = ?, 
          City = ?, 
          cust_ifsc = ?, 
          dist = ?, 
          cust_accno = ?
        WHERE  orgid = ? AND center_id = ? AND id = ?
      `;

      connection.query(
        updateDealerQuery,
        [
          cname,
          Phone,
          City,
          cust_ifsc,
          dist,
          cust_accno,
          dairy_id,
          center_id,
          id,
        ],
        (error, results) => {
          connection.release(); // Release the connection back to the pool

          if (error) {
            console.error("Error executing query: ", error);
            return res
              .status(500)
              .json({ message: "Error updating dealer", success: false });
          }

          if (results.affectedRows === 0) {
            return res
              .status(404)
              .json({ message: "Dealer not found", success: false });
          }

          return res
            .status(200)
            .json({ message: "Dealer updated successfully", success: true });
        }
      );
    } catch (error) {
      connection.release();
      console.error("Error processing request: ", error);
      return res
        .status(500)
        .json({ message: "Internal server error", success: false });
    }
  });
};

// ----------------------------------------------------------------------------------->

exports.deleteCustomer = async (req, res) => {
  const { cid } = req.body;

  const { dairy_id, center_id } = req.user;
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }
    try {
      const isdeleted = 1;
      const udeletequery = `
        UPDATE customer
        SET
          isdeleted = ?
        WHERE orgid = ? AND centerid = ? AND cid = ?
      `;

      connection.query(
        udeletequery,
        [isdeleted, dairy_id, center_id, cid],
        (error, results) => {
          connection.release();

          if (error) {
            console.error("Error executing query: ", error);
            return res.status(500).json({ message: "Error deleting customer" });
          }

          if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Customer not found" });
          }

          return res
            .status(200)
            .json({ message: "Customer deleted successfully" });
        }
      );
    } catch (error) {
      connection.release();
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};
