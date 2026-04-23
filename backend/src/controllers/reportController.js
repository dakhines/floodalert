// Report controller: saves user-submitted reports to MongoDB.
const { createReport } = require("../services/reportService");

function handleError(res, error) {
  if (
    error.name === "MongooseError" ||
    error.message?.includes("initial connection")
  ) {
    return res.status(503).json({
      success: false,
      message: "Database unavailable.",
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Something went wrong.",
  });
}

async function submitReport(req, res) {
  try {
    const report = await createReport(req.body);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    handleError(res, error);
  }
}

module.exports = { submitReport };
