/**
 * Browser stub: @metamask/sdk references @react-native-async-storage/async-storage,
 * which does not exist in Next.js. The SDK uses this for RN persistence only.
 */
const memory = new Map();

const storage = {
  getItem: async (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: async (key, value) => {
    memory.set(key, value);
  },
  removeItem: async (key) => {
    memory.delete(key);
  },
  clear: async () => {
    memory.clear();
  },
  getAllKeys: async () => Array.from(memory.keys()),
  multiGet: async (keys) => keys.map((k) => [k, memory.get(k) ?? null]),
  multiSet: async (pairs) => {
    pairs.forEach(([k, v]) => memory.set(k, v));
  },
  multiRemove: async (keys) => {
    keys.forEach((k) => memory.delete(k));
  },
};

module.exports = {
  __esModule: true,
  default: storage,
};
