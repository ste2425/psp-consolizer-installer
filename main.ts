import { app, BrowserWindow, ipcMain } from "electron";
import path from 'path';
import config from './config.json';

import {
  buildPath,
  delay,
  findConnectedBoard,
  flashPSPConsoliserFirmware,
  installSAMDCore,
  ninaUpgradeNeeded,
  upgradeNina,
  uploadArduinoSketchBinary
} from './arduino';

let mainWindow: BrowserWindow | undefined;

export function log(message: string) {
  if (!mainWindow)
    return;

  mainWindow.webContents.send('log', message);
}

export function logError(message: string) {
  if (!mainWindow)
    return;

  mainWindow.webContents.send('log:error', message);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', function () {
    mainWindow = undefined;
  });

  ipcMain.handle('program', program);

  ipcMain.handle('versions', versions);
}

app.whenReady()
  .then(() => createWindow());

app.on('window-all-closed', () => app.quit());

function versions() {
  return {
    bluePad: config.expectedFirmwareVersionText,
    sha: config.commitsha,
    message: config.commitMessage
  };
}

async function program() {
  log('--Installing SAMD core\n');
  await installSAMDCore();

  log('--Finding board\n');
  const board = await findConnectedBoard();

  log('--Uploading Nina firmware version checker\n');
  await uploadArduinoSketchBinary(buildPath('CheckFirmwareVersion.ino.bin'), board.port.address);

  await delay(3000);

  log('--Reading NINA firmware version\n')
  const upgradeNeeded = await ninaUpgradeNeeded(board.port.address);

  if (upgradeNeeded) {
    log('--Upgrade needed\n');
    await upgradeNina(board.port.address);
  } else {
    log('--Upgrade not needed\n');
  }

  log('--Uploading PSP-Consolizer\n');
  await delay(3000);
  await flashPSPConsoliserFirmware(board.port.address);

  log('--done');
}