const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./controller/globalErrorHandler");

if (process.env.NOD_ENV !== "production") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

app.use(cors());

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/messages", messageRoutes);

app.all("*", (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this API`));
});

app.use(globalErrorHandler);

module.exports = app;
