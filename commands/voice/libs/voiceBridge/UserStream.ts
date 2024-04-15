import Stream from "stream";

export default class UserStream extends Stream.Duplex {
  _read = () => {};
  _write = () => {};
  constructor(streamOptions?: Omit<Stream.ReadableOptions, "objectMode">) {
    super({ ...streamOptions, objectMode: true });
  }
}
