/**
 * Host virtual filesystem entry for shared imports (e.g. My Computer).
 * Win98: re-exports `./fileSystem` (`win98-filesystem` in localStorage).
 * KarpOS overrides `@/app/virtual-fs` in its tsconfig to `./app/virtual-fs.ts` (`karpos-filesystem-linux`, POSIX paths).
 */
export * from './fileSystem';
