export abstract class GMUProvider {
  abstract testQuery(query: string): Promise<boolean>;
  abstract getLink(query: string): Promise<string>;
}

export default class GMULib {
  providers: GMUProvider[];

  constructor() {
    this.providers = [];
  }

  addProviders(...providers: GMUProvider[]) {
    this.providers.push(...providers);
  }

  async scan(query = "") {
    return this.providers.find(async (v) => await v.testQuery(query));
  }

  async getDirectLink(query = "") {
    const provider = await this.scan(query);

    if (!provider) return;
    return provider.getLink(query);
  }
}
