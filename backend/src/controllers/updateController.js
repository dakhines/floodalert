// 引入 updateService 里的方法
const { getAllUpdates } = require("../services/updateService");

// 处理获取所有动态更新记录的请求
function fetchAllUpdates(req, res) {
  // 调用 getAllUpdates() 拿数据，并以 JSON 格式发送给前端
  res.json(getAllUpdates());
}

// 导出这个控制器函数
module.exports = {
  fetchAllUpdates
};