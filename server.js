const mongoose = require("mongoose");
const Pusher = require("pusher");
const User = require("./model/User");
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

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET_KEY,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

const db = mongoose.connection;

const asyncHandler = (fn, collection) => {
  return (change) => {
    fn(change).catch((err) => console.log(collection, err));
  };
};

db.once("open", () => {
  console.log("DB stream connected");

  const userStream = db.collection("users").watch();
  const conversationStream = db.collection("conversations").watch();
  const messageStream = db.collection("messages").watch();

  userStream.on(
    "change",
    asyncHandler(async (change) => {
      if (change.operationType === "update") {
        const updatedFields = change.updateDescription;
        updatedFields.updatedFields.avatar = undefined;
        if (updatedFields.updatedFields.isAccountActive) {
          const user = await User.findById(change.documentKey._id);
          console.log(user);
          pusher.trigger("users", "inserted", user);
        } else {
          pusher.trigger("users", "updated", {
            type: "updated",
            id: change.documentKey._id,
            ...updatedFields,
          });
        }
      } else if (change.operationType === "delete") {
        pusher.trigger("users", "deleted", {
          type: "deleted",
          ...change.documentKey,
        });
      }
    })
  );

  conversationStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const doc = change.fullDocument;
      pusher.trigger("conversations", "inserted", {
        ...doc,
        messages: [],
      });
    } else if (change.operationType === "delete") {
      pusher.trigger("conversations", "deleted", {
        type: "deleted",
        ...change.documentKey,
      });
    }
  });

  messageStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const doc = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        ...doc,
      });
    } else if (change.operationType === "delete") {
      pusher.trigger("conversations", "deleted", {
        type: "deleted",
        ...change.documentKey,
      });
    }
  });
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
