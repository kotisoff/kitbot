export const timer = {
  get now() {
    return Math.round(performance.now());
  }
};

export function normalizeFilepath(string: string) {
  return string.replace(/[\\/:*?"<>|.]/g, "").substring(0, 240);
}
