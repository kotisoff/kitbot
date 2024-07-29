import CustomClient from "../../core/CustomClient";
import Event from "../../core/Event";

export default class SIGINTEvent extends Event {
  constructor() {
    super("SIGINTEvent");
  }

  async createListener(client: CustomClient): Promise<any> {
    const log = this.logger;

    process.on("SIGINT", () => {
      log.info("Shutting down...");

      client.allCmd.forEach((command) => command.shutdown());

      log.info("Bye!");
      log.info("Process will stop in 5 seconds.".gray);

      client.destroy();
      setTimeout(() => {
        process.exit(0);
      }, 5000);
    });
  }
}
