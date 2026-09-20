/// <reference types="nativewind/types" />

// TypeScript 6 (SDK 57) raises TS2882 on a side-effect import of any file it
// has no declaration for — which includes `import './global.css'` in App.tsx,
// the entry point NativeWind's Metro transformer consumes. The import is real
// and load-bearing (it is what injects the Tailwind output), so it is declared
// here rather than removed.
declare module '*.css';
