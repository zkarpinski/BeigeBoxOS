const assert = require('assert');

function b64UrlDecode(str) {
  try {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = str.length % 4;
    if (pad) str += '===='.slice(0, 4 - pad);
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch (e) {
    return new Uint8Array(0);
  }
}

// Test with valid base64
const valid = btoa('hello world').replace(/=/g, '');
const decodedValid = b64UrlDecode(valid);
assert.strictEqual(new TextDecoder().decode(decodedValid), 'hello world');
console.log('✅ Valid base64 decoded correctly');

// Test with malformed base64 (contains invalid character for atob)
const malformed = '!!!';
const decodedMalformed = b64UrlDecode(malformed);
assert.strictEqual(decodedMalformed.length, 0);
console.log('✅ Malformed base64 (invalid chars) handled gracefully (returned empty array)');

// Test with malformed base64 (invalid length/padding that might cause atob to throw in some envs)
const malformed2 = 'a'; // base64 strings usually must be at least 2 chars if not empty
const decodedMalformed2 = b64UrlDecode(malformed2);
// Node's atob might throw or just return truncated.
// If it throws, our try/catch handles it.
console.log(
  '✅ Malformed base64 (invalid length) handled gracefully, returned length:',
  decodedMalformed2.length,
);

console.log('All b64UrlDecode verification tests passed!');
