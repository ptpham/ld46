import * as esbuild from "https://deno.land/x/esbuild@v0.25.0/mod.js";

await Deno.copyFile('./main.html', 'dist/main.html');

await esbuild.build({
  entryPoints: ["./lib/main.js"],
  bundle: true,
  platform: "browser",
  format: "esm",
  outfile: "dist/lib/main.js",
  sourcemap: true,
});
