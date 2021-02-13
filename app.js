const express = require("express");
const app = express();

const globalErrorHandler = require("./controller/globalErrorHandler");

if (process.env.NOD_ENV !== "production") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

app.use(express.json());

app.get("/", (req, res) => {
  res.send("app is running");
});

app.all("*", (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this API`));
});

app.use(globalErrorHandler);

module.exports = app;
