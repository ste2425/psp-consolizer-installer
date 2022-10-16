const fs = require("fs-extra");

const consolizerBinExists = fs.pathExistsSync(
    "PSP-Bluetooth-Controller.ino.bin"
  ),
  bluepadBinExists = fs.pathExistsSync("bluepad32-nina.bin");

const config = fs.readFileSync("config.json").toString();

const configVersionSet = !config.includes("<changeme>");

if (!consolizerBinExists)
  console.error(
    "\nPSP Consolizer binary (PSP-Bluetooth-Controller.ino.bin) does not exist\n"
  );

if (!bluepadBinExists)
  console.error("\nBluepad32 binary (bluepad32-nina.bin) does not exist\n");

if (!configVersionSet) console.error("\nBluepad32 version not set in config\n");

if (!consolizerBinExists || !bluepadBinExists || !configVersionSet)
  process.exit(1);
