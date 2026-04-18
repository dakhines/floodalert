// 引入 Express 框架的路由功能
const express = require("express");
const router = express.Router();

// 引入我们刚才写好的 updateController 里的方法
const { fetchAllUpdates } = require("../controllers/updateController");

// 定义路由规则
// 当收到针对根路径 "/" 的 GET 请求时，执行 fetchAllUpdates 把所有的动态更新发回去
router.get("/", fetchAllUpdates);

// 导出这个设定好的路由器
module.exports = router;