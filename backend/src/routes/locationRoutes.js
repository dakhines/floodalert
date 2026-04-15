// 引入 Express 框架的路由功能
const express = require("express");
const router = express.Router();

// 引入我们在上一层写好的控制器 (Controller)
const {
  fetchAllLocations,
  fetchLocationByName
} = require("../controllers/locationController");

// 定义路由规则 (API Endpoints)
// 1. 当收到针对根路径 "/" 的 GET 请求时，执行 fetchAllLocations 把所有数据发回去
router.get("/", fetchAllLocations);

// 2. 当收到带有参数的请求 (比如 "/Ayer Keroh") 时，把 "Ayer Keroh" 存入 :name 参数，并执行 fetchLocationByName
router.get("/:name", fetchLocationByName);

// 导出这个设定好的路由器
module.exports = router;