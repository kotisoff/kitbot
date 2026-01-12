import { getRootData, RootData } from "@sapphire/pieces";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export class ContentPack {
  identifier: string;
  name: string;
  description: string;
  version: string;
  authors: string[];
  path: string;
  main: string | undefined;

  constructor(raw_pack: Partial<ContentPack> & { author?: string }, path: string) {
    if (!raw_pack.identifier)
      throw Error(`Pack identifier is not defined in pack.json (see: ${join(path, "pack.json")}).`);

    this.identifier = raw_pack.identifier;
    this.name = raw_pack.name ?? raw_pack.identifier;
    this.description = raw_pack.description ?? "none";
    this.version = raw_pack.version ?? "0";
    this.authors = raw_pack.authors ?? [raw_pack.author ?? "none"];
    this.path = path;
    this.main = raw_pack.main;
  }

  loadConfig<T>(configName: string, defaultConfig?: T): T {
    const configDir = join(process.cwd(), "configs", this.identifier);
    const configPath = join(configDir, configName);

    if (!existsSync(configPath)) {
      mkdirSync(configDir, { recursive: true });
      writeFileSync(configPath, JSON.stringify(defaultConfig ?? {}));
      return defaultConfig ?? ({} as T);
    }

    return JSON.parse(readFileSync(configPath).toString());
  }

  init() {
    if (this.main) {
      try {
        //@ts-ignore
        require(join(this.path, this.main));
      } catch (e) {
        console.log(`[${this.identifier}]`, "Failed loading main file:");
        console.error(e);
      }
    }
  }
}

export default class ContentHandler {
  private static _contentPacks: Map<string, ContentPack> = new Map();

  static get contentPacks() {
    return new Map(this._contentPacks);
  }

  public static loadContent(rootdata: RootData) {
    this._contentPacks = new Map();

    const dir = join(rootdata.root, "content");
    const packs: Map<string, ContentPack> = new Map();

    const contentTree = readdirSync(dir)
      .map((f) => join(dir, f))
      .filter((f) => lstatSync(f).isDirectory());

    contentTree.forEach((dir) => {
      const pack_file = join(dir, "pack.json");

      if (!existsSync(pack_file)) return;

      const pack = new ContentPack(JSON.parse(readFileSync(pack_file).toString()), dir);

      packs.set(pack.identifier, pack);
    });

    this._contentPacks = packs;

    return this.contentPacks;
  }
}
