const YMProvider = require("./providers/yandexMusicProvider");

module.exports = class getMusicUrl {
  constructor(){
    this.providers = [];
  }

  addProviders(...providers){
    this.providers.push(...providers)
  }

  async scan(query = ""){
    for(let provider of this.providers){
      if(provider.scan(query)) return provider;
    }
    throw "No provider found."
  }

  async getDirectLink(query = ""){
    const provider = await this.scan(query);
    return provider.getLink(query);
  }
}