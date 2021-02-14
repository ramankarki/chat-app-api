const express = require("express");
const app = express();

const userRoutes = require("./routes/userRoutes");
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./controller/globalErrorHandler");

if (process.env.NOD_ENV !== "production") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

app.use(express.json());

app.use("/api/v1/users", userRoutes);

app.all("*", (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this API`));
});

app.use(globalErrorHandler);

module.exports = app;
