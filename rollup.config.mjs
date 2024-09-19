import fs from 'fs';
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

import pkg from "./package.json" assert { type: "json" };
const version = pkg.version;

const hasSourceMap = 'production' !== process.env.BUILD;

const banner = `/*!
* easy-barcode-scanner
* @version ${version} (build ${(new Date()).toISOString()})
* A wrapper for https://github.com/Dynamsoft/barcode-reader-javascript. Easier to use.
* The wrapper is under Unlicense, the Dynamsoft SDK it depended is still protected by copyright.
*/`;
export default async (commandLineArgs)=>{
  fs.rmSync('dist', {recursive: true, force: true });
    
  
  return [
    {
      input: "src/index.ts",
      plugins: [
        nodeResolve(),
        typescript({ tsconfig: "./tsconfig.json", sourceMap: hasSourceMap }),
      ],
      external: [
        "dynamsoft-core",
        "dynamsoft-license",
        "dynamsoft-capture-vision-router",
        "dynamsoft-camera-enhancer",
        "dynamsoft-barcode-reader",
        "dynamsoft-utility",
      ],
      output: [
        {
          file: "dist/easy-barcode-scanner.js",
          format: "umd",
          name: "EasyBarcodeScanner",
          exports: "default",
          banner: banner,
          sourcemap: hasSourceMap,
          globals: {
            "dynamsoft-core": "Dynamsoft.Core",
            "dynamsoft-license": "Dynamsoft.License",
            "dynamsoft-capture-vision-router": "Dynamsoft.CVR",
            "dynamsoft-camera-enhancer": "Dynamsoft.DCE",
            "dynamsoft-barcode-reader": "Dynamsoft.DBR",
            "dynamsoft-utility": "Dynamsoft.Utility",
          },
          plugins: [terser({ ecma: 5 })],
        },
        {
          file: "dist/easy-barcode-scanner.mjs",
          format: "es",
          exports: "default",
          banner: banner,
          sourcemap: hasSourceMap,
          plugins: [
            terser({ ecma: 6 }),
            {
              // https://rollupjs.org/guide/en/#writebundle
              writeBundle(options, bundle){
                fs.cpSync('dist/easy-barcode-scanner.mjs','dist/easy-barcode-scanner.esm.js');
              }
            },
          ],
        },
      ],
    },
  ]
};

