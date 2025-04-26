
rm dist
mkdir dist/lib
esbuild ./lib/main.js > dist/lib/main.js --bundle
cp main.html dist/main.html
