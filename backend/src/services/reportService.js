const Report = require("../models/Report");

function normalize(value) {
  return String(value || "").trim();
}

async function createReport(input) {
  const problemType = normalize(input.problemType);
  const explanation = normalize(input.explanation);

  if (!problemType || !explanation) {
    const error = new Error("Problem type and explanation are required.");
    error.statusCode = 400;
    throw error;
  }

  const report = await Report.create({
    problemType,
    explanation,
    otherProblem: normalize(input.otherProblem),
    imageName: normalize(input.imageName),
    reporterEmail: normalize(input.reporterEmail).toLowerCase(),
    reporterName: normalize(input.reporterName),
  });

  return {
    id: String(report._id),
    problemType: report.problemType,
    explanation: report.explanation,
    otherProblem: report.otherProblem,
    imageName: report.imageName,
    reporterEmail: report.reporterEmail,
    reporterName: report.reporterName,
    createdAt: report.createdAt,
  };
}

module.exports = { createReport };
