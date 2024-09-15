import CustomClient from "../../core/CustomClient";
import Event from "../../core/Event";

export default class ExceptionEvents extends Event {
  constructor() {
    super("ExceptionEvents");
  }

  async createListener(client: CustomClient): Promise<any> {
    const log = this.logger;

    process
      .on("unhandledRejection", (error) => {
        log.error("Unhandled rejection:", error);
      })
      .on("uncaughtException", (error) => {
        log.error("Uncaught exception:", error);
      });
  }
}
