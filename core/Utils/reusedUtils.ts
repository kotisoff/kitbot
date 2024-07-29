export const timer = {
  get now() {
    return Math.round(performance.now());
  }
};
