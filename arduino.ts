import { spawn } from 'child_process';
import { SerialPort } from 'serialport';
import { log, logError } from './main';
import config from './config.json';
import { join } from 'path';
import { BoardNotFoundError, FirmwareVersionFinderTimeoutError, FirmwareVersionMissMatch } from './errors';
import { IBoard, ICommandOptions } from './types';

const NANO_FQBN = 'arduino:samd:nano_33_iot';

/*
    If running from a package code is within an app.asar file which is just a glorified container
    However node:spawn and any executables cannot access paths within the asar so they are exported out

    As a result the path to them needs changing to point to the unpackaed file.

    If running in dev it does not matter.
*/
export const buildPath = (file: string) => {
    return join(
        __dirname,
        ...(
            // Traverse out the asar and into the unpacked folder
            __dirname.includes('app.asar') ?
                [
                    '..',
                    '..',
                    'app.asar.unpacked',
                    'dist'
                ] :
                []
        ),
        file
    );
};

function runCommand({
    executable,
    commands,
    onStdout = () => { },
    onStderr = () => { }
}: ICommandOptions): Promise<string> {
    return new Promise(function (resolve, reject) {
        let stdoutBuffer = '',
            stderrBuffer = '';
        const process = spawn(buildPath(executable), commands);

        process.stdout.on('data', d => {
            const data = d.toString();
            stdoutBuffer += data;

            onStdout(data);
        });

        process.stderr.on('data', d => {
            const data = d.toString();
            stderrBuffer += data;

            onStderr(data);
        });

        process.on('close', (code) => code && code !== 0 ? reject(stderrBuffer) : resolve(stdoutBuffer));

        process.on('error', reject);
    });
}

function runArduinoCommand(options: Omit<ICommandOptions, 'executable'>) {
    return runCommand({
        executable: 'arduino-cli.exe',
        ...options
    });
}

function runFirmwareCommand(options: Omit<ICommandOptions, 'executable'>) {
    return runCommand({
        executable: 'arduino-fwuploader.exe',
        ...options
    });
}

async function runCommandAsJSON<T>(...commands: string[]): Promise<T> {
    const result = await runArduinoCommand({
        commands: [...commands, '--format', 'json'],
        onStderr: logError
    });

    return JSON.parse(result);
}

/**
 * Check if the nina firware needs upgrading.
 * 
 * Open the Serial port and listen for the version number being emitted.
 * 
 * Requires the CheckFirmwareVersion.ino binary being uploaded
 */
export async function ninaUpgradeNeeded(port: string) {
    return new Promise((res, rej) => {
        const sPort = new SerialPort({
            path: port,
            baudRate: 57600
        }, e => {
            if (e) {
                clearTimeout(autoKill);
                rej(e);
            }
        });

        let buffer = '';

        const parseVersion = () => {

            if (buffer.includes('ERROR')) {
                rej(buffer);
            } else {
                const value = buffer
                    .replace('done', '')
                    .replace(/\s+/g, ' ')
                    .trim();

                res(value !== config.expectedFirmwareVersionText);
            }
        };

        const autoKill = setTimeout(() => {
            sPort.close();

            rej(new FirmwareVersionFinderTimeoutError());
        }, 10000);

        sPort.on('data', d => {
            const data = d.toString();
            buffer += data;

            log(data);

            if (buffer.includes('done')) {
                clearTimeout(autoKill);
                sPort.close();

                parseVersion();
            }
        });
    });
}

export async function uploadArduinoSketchBinary(binary: string, port: string): Promise<string> {
    return await runArduinoCommand({
        commands: [
            'upload',
            '--input-file', binary,
            '--fqbn', NANO_FQBN,
            '-p', port
        ],
        onStdout: log,
        onStderr: logError
    });
}

export async function flashNinaFirmware(port: string) {
    return await runFirmwareCommand({
        commands: [
            'firmware',
            'flash',
            '-i', buildPath(config.firmwareBinary),
            '-b', NANO_FQBN,
            '-a', port
        ],
        onStdout: log,
        onStderr: logError
    });
}

export async function installSAMDCore() {
    await runArduinoCommand({
        commands: [
            'core',
            'update-index'
        ],
        onStdout: log,
        onStderr: logError
    });

    await runArduinoCommand({
        commands: [
            'core',
            'install',
            'arduino:samd'
        ],
        onStdout: log,
        onStderr: logError
    });
}

export async function findConnectedBoard() {
    const connectedBoards = await runCommandAsJSON<IBoard[]>(
        'board',
        'list'
    );

    const board = connectedBoards.find((b) => {
        const matchedBoards = b.matching_boards || [];

        return matchedBoards.find(mB => mB.fqbn === NANO_FQBN);
    });

    if (!board)
        throw new BoardNotFoundError(NANO_FQBN, connectedBoards);

    return board;
}

export async function delay(time: number) {
    return new Promise((r) => setTimeout(r, time));
}

export async function flashPSPConsoliserFirmware(port: string) {
    await uploadArduinoSketchBinary(buildPath(config.pspConsoliserBinary), port);
}

export async function upgradeNina(port: string) {
    log('--Uploading firmware passthrough\n');
    await uploadArduinoSketchBinary(buildPath('SerialNINAPassthrough.ino.bin'), port);

    await delay(3000);

    log('--Flashing Nina firmware\n');
    await flashNinaFirmware(port);

    await delay(3000);

    log('--Uploading Nina firmware version checker to verify\n');
    await uploadArduinoSketchBinary(buildPath('CheckFirmwareVersion.ino.bin'), port);

    await delay(3000);

    log('--Reading NINA firmware version\n')
    const upgradeNeeded = await ninaUpgradeNeeded(port);

    if (upgradeNeeded)
        throw new FirmwareVersionMissMatch();
}