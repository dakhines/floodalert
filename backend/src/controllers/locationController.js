// 从我们刚才写的 locationService 中引入这两个方法
const {
  getAllLocations,
  getLocationByName
} = require("../services/locationService");

// 处理获取所有地点数据的请求
function fetchAllLocations(req, res) {
  // 调用 service 拿数据，并通过 res.json() 以 JSON 格式发送给前端
  res.json(getAllLocations());
}

// 处理根据名字获取特定地点数据的请求
function fetchLocationByName(req, res) {
  // 从请求的 URL 参数中提取名字 (req.params.name)
  const location = getLocationByName(req.params.name);

  // 如果找不到这个地点，返回 404 错误状态码和错误提示
  if (!location) {
    return res.status(404).json({ error: "Location not found" });
  }

  // 如果找到了，就把对应的地点数据发给前端
  res.json(location);
}

// 导出这两个控制器函数，供路由（Routes）使用
module.exports = {
  fetchAllLocations,
  fetchLocationByName
};