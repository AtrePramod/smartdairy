const express = require("express");
const verifyToken = require("../Middlewares/VerifyToken");
const {
  masterDates,
  dairyInfo,
  dairyDashboardInfo,
  updatedetails,
  maxCenterId,
  createCenter,
  updateCenterInfo,
  getCenterDetails,
  getAllcenters,
  maxRateChartNo,
  saveRateChart,
  listRatecharts,
  applyRateChart,
  rateChartMilkColl,
  getSelectedRateChart,
  updateSelectedRateChart,
  saveUpdatedRC,
  sendMessage,
  getCenterWiseMilkData,
} = require("../Controllers/DairyController");
const router = express.Router();

//dairy routes
router.route("/dairy/masters").post(masterDates);
router.route("/dairy/dashboard").post(verifyToken, dairyDashboardInfo);
router.route("/dairyinfo").post(verifyToken, dairyInfo);
router.route("/update/dairyinfo").post(verifyToken, updatedetails);
router.route("/center/maxid").post(verifyToken, maxCenterId);
router.route("/create/center").post(verifyToken, createCenter);
router.route("/update/centerdetails").post(verifyToken, updateCenterInfo);
router.route("/center/details").post(verifyToken, getCenterDetails);
router.route("/all/centerdetails").post(verifyToken, getAllcenters);
router.route("/send-message").post(verifyToken, sendMessage); //send whats app message
// Dashboard data display routes -------------------------------------------------------------------->
router
  .route("/dashboard/centers-data")
  .post(verifyToken, getCenterWiseMilkData);

module.exports = router;
