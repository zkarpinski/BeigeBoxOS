// Stub for three/examples/jsm/* — these are ESM-only modules that can't be
// parsed by Jest's CommonJS transform. The real code only runs in the browser
// (inside a useEffect), so a no-op stub is sufficient for tests.
function RoomEnvironment() {}
RoomEnvironment.prototype = {};

module.exports = { RoomEnvironment };
