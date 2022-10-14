export interface IBoard {
    port: {
        address: string,
        label: string,
        protocol: string,
        protocol_label: string,
        properties?: {
            pid: string,
            serialNumber: string,
            vid: string
        }
    },
    matching_boards?: { name: string, fqbn: string }[]
}

export interface ICommandOptions {
    executable: 'arduino-cli.exe' | 'arduino-fwuploader.exe',
    commands: string[],
    onStdout?: (data: string) => void,
    onStderr?: (data: string) => void
}