import { getRootData } from "@sapphire/pieces";
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface ContentPack {
  identifier: string;
  name: string;
  description: string;
  version: string;
  authors: string[];
  path: string;
}

export default class ContentHandler {
  private static rootData = getRootData();
  private static contentDir = join(ContentHandler.rootData.root, "content");
  private static _contentPacks: Map<string, ContentPack> = new Map();

  static get contentPacks() {
    return new Map(ContentHandler._contentPacks);
  }

  public static loadContent() {
    const dir = ContentHandler.contentDir;
    const packs: Map<string, ContentPack> = new Map();

    const contentTree = readdirSync(dir)
      .map((f) => join(dir, f))
      .filter((f) => lstatSync(f).isDirectory());

    contentTree.forEach((dir) => {
      const pack_file = join(dir, "pack.json");

      if (!existsSync(pack_file)) return;

      const raw_pack_info: Partial<ContentPack> & { author?: string } = JSON.parse(readFileSync(pack_file).toString());

      if (!raw_pack_info.identifier || !raw_pack_info.version) return;

      const pack_info: ContentPack = {
        identifier: raw_pack_info.identifier,
        name: raw_pack_info.name ?? raw_pack_info.identifier,
        description: raw_pack_info.description ?? "none",
        version: raw_pack_info.version,
        authors: raw_pack_info.authors ?? [raw_pack_info.author ?? "none"],
        path: dir
      };

      packs.set(pack_info.identifier, pack_info);
    });

    ContentHandler._contentPacks = packs;

    return ContentHandler.contentPacks;
  }
}
