import { IBoard } from "./types";

export class FirmwareVersionMissMatch extends Error {
    constructor() {
        super('There is a firmware version mismatch after flashing');
    }
}

export class FirmwareVersionFinderTimeoutError extends Error {
    constructor() {
        super('Timeout trying to read firmware version');
    }
}

export class BoardNotFoundError extends Error {
    constructor(fqbn: string, connectedBoards: IBoard[]) {
        super(`Board not found from list of boards.\nFQBN\n '${fqbn}'\nBoards\n${JSON.stringify(connectedBoards, null, 3)}`);
    }
}