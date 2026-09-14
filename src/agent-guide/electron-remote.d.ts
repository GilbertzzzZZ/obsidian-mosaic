// Obsidian supplies this desktop-only module; it is not bundled with the plugin.
declare module "@electron/remote" {
	export const dialog: {
		showOpenDialog(options: {
			properties: ("openDirectory" | "createDirectory")[];
		}): Promise<{ canceled: boolean; filePaths: string[] }>;
	};
}
