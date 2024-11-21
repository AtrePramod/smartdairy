const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const pool = require("../Configs/Database");
dotenv.config({ path: "Backend/.env" });

//.................................................................
// Create Emp (Admin Route)........................................
//.................................................................

// exports.createEmployee = async (req, res) => {
//   const {
//     date,
//     marathi_name,
//     emp_name,
//     mobile,
//     designation,
//     salary,
//     city,
//     tehsil,
//     district,
//     pincode,
//     bankName,
//     bank_ac,
//     bankIFSC,
//     password,
//   } = req.body;
//
//   const dairy_id = req.user.dairy_id;
//   const center_id = req.user.center_id;
//   const user_role = req.user.user_role;
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
//         // Step 2: Insert into EmployeeMaster table
//         const createEmployeeQuery = `
//           INSERT INTO EmployeeMaster (
//              dairy_id, center_id, emp_name , marathi_name, emp_mobile , emp_bankname , emp_accno , emp_ifsc , emp_city , emp_tal , emp_dist , createdon, createdby , designation , salary , pincode, emp_id
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;
//
//         connection.query(
//           createEmployeeQuery,
//           [
//             dairy_id,
//             center_id,
//             emp_name,
//             marathi_name,
//             mobile,
//             bankName,
//             bank_ac,
//             bankIFSC,
//             city,
//             tehsil,
//             district,
//             date,
//             user_role,
//             designation,
//             salary,
//             pincode,
//             emp_id,
//           ],
//           (err, result) => {
//             if (err) {
//               return connection.rollback(() => {
//                 connection.release();
//                 console.error(
//                   "Error inserting into EmployeeMaster table: ",
//                   err
//                 );
//                 return res
//                   .status(500)
//                   .json({ message: "Database query error" });
//               });
//             }
//
//             // Step 3: Insert into users table
//             const createUserQuery = `
//               INSERT INTO users (
//                 username, password, isAdmin, createdon, createdby, designation,
//                 mobile, SocietyCode, center_id
//               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `;
//
//             connection.query(
//               createUserQuery,
//               [
//                 mobile,
//                 password,
//                 1, // Assuming the user is always an admin by default
//                 date,
//                 user_role,
//                 designation,
//                 mobile,
//                 dairy_id,
//                 center_id,
//               ],
//               (err, result) => {
//                 if (err) {
//                   return connection.rollback(() => {
//                     connection.release();
//                     console.error("Error inserting into users table: ", err);
//                     return res
//                       .status(500)
//                       .json({ message: "Database query error" });
//                   });
//                 }
//
//                 // Commit transaction after both inserts succeed
//                 connection.commit((err) => {
//                   if (err) {
//                     return connection.rollback(() => {
//                       connection.release();
//                       console.error("Error committing transaction: ", err);
//                       return res
//                         .status(500)
//                         .json({ message: "Error committing transaction" });
//                     });
//                   }
//
//                   connection.release();
//                   res
//                     .status(200)
//                     .json({ message: "Employee created successfully!" });
//                 });
//               }
//             );
//           }
//         );
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

exports.createEmployee = async (req, res) => {
  const {
    date,
    marathi_name,
    emp_name,
    mobile,
    designation,
    salary,
    city,
    tehsil,
    district,
    pincode,
    bankName,
    bank_ac,
    bankIFSC,
    password,
  } = req.body;

  const dairy_id = req.user.dairy_id;
  const center_id = req.user.center_id;
  const user_role = req.user.user_role;

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
        // Step 1: Find the maximum emp_id and increment it
        const findMaxEmpIdQuery = `SELECT MAX(emp_id) AS maxEmpId FROM EmployeeMaster WHERE dairy_id = ? AND center_id = ?`;

        connection.query(
          findMaxEmpIdQuery,
          [dairy_id, center_id],
          (err, results) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("Error finding max emp_id: ", err);
                return res
                  .status(500)
                  .json({ message: "Database query error" });
              });
            }

            const maxEmpId = results[0].maxEmpId || `1`;
            const newEmpId = maxEmpId + 1;
            
            // Step 2: Insert into EmployeeMaster table
            const createEmployeeQuery = `
            INSERT INTO EmployeeMaster (
              dairy_id, center_id, emp_name, marathi_name, emp_mobile, emp_bankname, emp_accno, emp_ifsc, 
              emp_city, emp_tal, emp_dist, createdon, createdby, designation, salary, pincode, emp_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

            connection.query(
              createEmployeeQuery,
              [
                dairy_id,
                center_id,
                emp_name,
                marathi_name,
                mobile,
                bankName,
                bank_ac,
                bankIFSC,
                city,
                tehsil,
                district,
                date,
                user_role,
                designation,
                salary,
                pincode,
                newEmpId,
              ],
              (err, result) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error(
                      "Error inserting into EmployeeMaster table: ",
                      err
                    );
                    return res
                      .status(500)
                      .json({ message: "Database query error" });
                  });
                }

                // Step 3: Insert into users table
                const createUserQuery = `
                INSERT INTO users (
                  username, password, isAdmin, createdon, createdby, designation, 
                  mobile, SocietyCode, center_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `;

                connection.query(
                  createUserQuery,
                  [
                    mobile,
                    password,
                    1, // Assuming the user is always an admin by default
                    date,
                    user_role,
                    designation,
                    mobile,
                    dairy_id,
                    center_id,
                  ],
                  (err, result) => {
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
                        .json({ message: "Employee created successfully!" });
                    });
                  }
                );
              }
            );
          }
        );
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

//.................................................................
// Find Employee By Code To update ................................
//.................................................................

exports.findEmpByCode = async (req, res) => {
  const { code } = req.body;
  console.log(code);

  const dairy_id = req.user.dairy_id;
  const center_id = req.user.center_id;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    const deleteEmpQuery = `
      SELECT * FROM EmployeeMaster
      WHERE dairy_id = ? AND center_id = ? AND emp_id = ?
    `;

    connection.query(
      deleteEmpQuery,
      [dairy_id, center_id, code],
      (error, result) => {
        connection.release();

        if (error) {
          console.error("Error executing query: ", error);
          return res
            .status(500)
            .json({ message: "Error retrieving employee data" });
        }

        return res.status(200).json({ employee: result });
      }
    );
  });
};

//.................................................................
// Update Emp Info (Admin Route) ..................................
//.................................................................

exports.updateEmployee = async (req, res) => {
  const {
    code,
    date,
    marathi_name,
    emp_name,
    designation,
    salary,
    city,
    tehsil,
    district,
    pincode,
    bankName,
    bank_ac,
    bankIFSC,
  } = req.body;

  const dairy_id = req.user.dairy_id;
  const center_id = req.user.center_id;
  const user_role = req.user.user_role;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      // Corrected table name to EmployeeMaster
      const updateEmpQuery = `
        UPDATE EmployeeMaster
        SET
           dairy_id = ?, center_id = ?, emp_name = ?, marathi_name = ?, emp_bankname = ?, emp_accno = ?, emp_ifsc = ?, emp_city = ?, emp_tal = ?, emp_dist = ?, updatedon = ?, updatedby = ?, designation = ?, salary = ?, pincode = ?
        WHERE emp_id = ?
      `;

      connection.query(
        updateEmpQuery,
        [
          dairy_id,
          center_id,
          emp_name,
          marathi_name,
          bankName,
          bank_ac,
          bankIFSC,
          city,
          tehsil,
          district,
          date,
          user_role,
          designation,
          salary,
          pincode,
          code,
        ],
        (error, results) => {
          connection.release();

          if (error) {
            console.error("Error executing query: ", error);
            return res.status(500).json({ message: "Error updating employee" });
          }

          if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Employee not found" });
          }

          return res
            .status(200)
            .json({ message: "Employee updated successfully" });
        }
      );
    } catch (error) {
      connection.release();
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

//.................................................................
// Delete Emp (Admin Route) .......................................
//.................................................................

exports.deleteEmployee = async (req, res) => {
  const { emp_id } = req.body;

  const dairy_id = req.user.dairy_id;
  const center_id = req.user.center_id;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    try {
      const deleteEmpQuery = `
        DELETE FROM  EmployeeMaster
        WHERE dairy_id = ? AND center_id = ? AND emp_id = ?
      `;

      connection.query(
        deleteEmpQuery,
        [dairy_id, center_id, emp_id],
        (error, results) => {
          connection.release();

          if (error) {
            console.error("Error executing query: ", error);
            return res.status(500).json({ message: "Error updating customer" });
          }

          if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Employee not found" });
          }

          return res
            .status(200)
            .json({ message: "Employee Deleted successfully" });
        }
      );
    } catch (error) {
      connection.release();
      console.error("Error processing request: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

//.................................................................
// Employee List (Admin Route) ....................................
//.................................................................

exports.employeeList = async (req, res) => {
  const dairy_id = req.user.dairy_id;
  const center_id = req.user.center_id;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: ", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    const deleteEmpQuery = `
      SELECT emp_name, emp_mobile, designation, salary , emp_id
      FROM EmployeeMaster
      WHERE dairy_id = ? AND center_id = ?
    `;

    connection.query(deleteEmpQuery, [dairy_id, center_id], (error, result) => {
      connection.release();

      if (error) {
        console.error("Error executing query: ", error);
        return res
          .status(500)
          .json({ message: "Error retrieving employee data" });
      }

      return res.status(200).json({ empList: result });
    });
  });
};
