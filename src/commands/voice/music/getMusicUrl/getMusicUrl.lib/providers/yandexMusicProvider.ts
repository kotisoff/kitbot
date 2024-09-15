import { YMApi, WrappedYMApi } from "ym-api-meowed";
import { GMUProvider } from "..";

export default class YMProvider extends GMUProvider {
  api: YMApi;
  wrapper: WrappedYMApi;

  constructor(config = { access_token: "", uid: 0 }) {
    super();

    this.api = new YMApi();
    this.wrapper = new WrappedYMApi(this.api);
    this.api.init(config);
  }

  Regex = /(^https:)\/\/music\.yandex\.[A-Za-z]+\/album\/[0-9]+\/track\/[0-9]+/;

  async testQuery(query = "") {
    return this.Regex.test(query);
  }

  async getLink(query = "") {
    const trackid = parseInt(query.split("/track/")[1]);

    return this.wrapper.getMp3DownloadUrl(trackid, true);
  }
}
