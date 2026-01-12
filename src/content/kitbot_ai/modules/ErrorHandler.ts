import ModelManager from "./ModelManager";

process
  .on("unhandledRejection", (error) => {
    console.error("Unhandled rejection:", error);
  })
  .on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
  });
