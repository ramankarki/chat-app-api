const mongoose = require("mongoose");
const app = require("./app.js");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err);
  process.exit(1);
});

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "./config.env" });
}

mongoose
  .connect(process.env.DB_STRING, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connections successfull");
  });

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () =>
  console.log(`server is running at http://localhost:${PORT}`)
);

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM RECEIVED. Shutting down gracefully.");
  server.close(() => {
    console.log("Process terminated !");
  });
});
