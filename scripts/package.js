const fs = require("fs-extra");
const path = require("path");

const output = path.join(__dirname, "../output");

const dir1 = path.join(__dirname, "../packages/splitview/typedocs");
const dir2 = path.join(__dirname, "../packages/splitview-demo/dist");

fs.copySync(dir1, path.join(output,'build'));
fs.copySync(dir2, path.join(output,'docs'));