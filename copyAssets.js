const fs = require("fs-extra"),
  path = require("path");

const filesToCopy = [
  "arduino-cli.exe",
  "arduino-cli.yaml",
  "arduino-fwuploader.exe",
  "bluepad32-nina.bin",
  "browserWindow.css",
  "index.html",
  "CheckFirmwareVersion.ino.bin",
  "config.json",
  "PSP-Bluetooth-Controller.ino.bin",
  "SerialNINAPassthrough.ino.bin",
];

for (const file of filesToCopy) {
  fs.copySync(file, path.join("dist", file));
}
