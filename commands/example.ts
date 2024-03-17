import Command from "../core/Command";

export default class ExampleCommand extends Command {
  constructor(options: any) {
    super(options);
  }
  async runSlash(): Promise<any> {
    return true;
  }
  async shutdown(): Promise<any> {
    return true;
  }
}
