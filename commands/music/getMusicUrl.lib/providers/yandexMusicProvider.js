const ymapi = require("ym-api-meowed");

module.exports = class YMProvider {
  constructor(config = {access_token: "", uid: 0}){
    this.api = new ymapi.YMApi();
    this.wrapper = new ymapi.WrappedYMApi(this.api);
    this.api.init(config)
  }

  Regex = /(^https:)\/\/music\.yandex\.[A-Za-z]+\/album\/[0-9]+\/track\/[0-9]+/;

  async scan(query = ""){
    return this.Regex.test(query)
  }

  async getLink(query = ""){
    const trackid = parseInt(query) == query ? query : parseInt(query.split("/track/")[1])
    return this.wrapper.getMp3DownloadUrl(trackid, true);
  }
}