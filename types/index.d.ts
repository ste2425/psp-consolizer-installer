export { };

declare global {
  interface Window {
    mainAPI: {
      program: () => Promise<void>,
      onLog: (cb: (event: IpcRendererEvent, message: string) => void) => void,
      onLogError: (cb: (event: IpcRendererEvent, message: string) => void) => void,
      versions: Promise<{
        bluePad: string,
        sha: string,
        message: string
      }>
    }
  }
}