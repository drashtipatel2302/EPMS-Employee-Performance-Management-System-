const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { submitGrievance, getMyGrievances, getAllGrievances, updateGrievance } = require("../controllers/grievanceController");

router.use(protect);
router.post("/", authorizeRoles("EMPLOYEE"), submitGrievance);
router.get("/my", authorizeRoles("EMPLOYEE"), getMyGrievances);
router.get("/", authorizeRoles("HR", "SUPER_ADMIN", "MANAGER"), getAllGrievances);
router.put("/:id", authorizeRoles("HR", "SUPER_ADMIN", "MANAGER"), updateGrievance);

module.exports = router;
