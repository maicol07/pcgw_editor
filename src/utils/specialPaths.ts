export interface SpecialPath {
    id: string;
    label: string;
    value: string;
    helpText: string;
    category: string;
}

export const specialPaths: SpecialPath[] = [
    // General
    { id: 'game', label: '<path-to-game>', value: '{{p|game}}', helpText: 'The base installation folder', category: 'General' },
    { id: 'uid', label: '<user-id>', value: '{{p|uid}}', helpText: 'The user ID or profile name (specific to your account or computer)', category: 'General' },
    { id: 'steam', label: '<Steam-folder>', value: '{{p|steam}}', helpText: 'The base Steam installation folder', category: 'General' },
    { id: 'steamlibrary', label: '<SteamLibrary-folder>', value: '{{p|steamlibrary}}', helpText: 'The SteamLibrary folder the user installed the game under; or the base Steam installation folder if no alternate location was used.', category: 'General' },
    { id: 'uplay', label: '<Ubisoft-Connect-folder>', value: '{{p|uplay}}', helpText: 'The base Ubisoft Connect (Ubisoft Game Launcher) installation folder', category: 'General' },
    { id: 'ubisoftconnect', label: '<Ubisoft-Connect-folder>', value: '{{p|ubisoftconnect}}', helpText: 'The base Ubisoft Connect (Ubisoft Game Launcher) installation folder', category: 'General' },
    
    // Windows > Registry
    { id: 'hkcu', label: 'HKEY_CURRENT_USER', value: '{{p|hkcu}}', helpText: 'Windows Registry path (use the Registry Editor to access)', category: 'Windows Registry' },
    { id: 'hkey_current_user', label: 'HKEY_CURRENT_USER', value: '{{p|hkey_current_user}}', helpText: 'Windows Registry path (use the Registry Editor to access)', category: 'Windows Registry' },
    { id: 'hklm', label: 'HKEY_LOCAL_MACHINE', value: '{{p|hklm}}', helpText: 'Windows Registry path (use the Registry Editor to access)', category: 'Windows Registry' },
    { id: 'hkey_local_machine', label: 'HKEY_LOCAL_MACHINE', value: '{{p|hkey_local_machine}}', helpText: 'Windows Registry path (use the Registry Editor to access)', category: 'Windows Registry' },
    { id: 'wow64', label: 'Wow6432Node', value: '{{p|wow64}}', helpText: 'Omit this folder for 32-bit versions of Windows', category: 'Windows Registry' },

    // Windows > Drive
    { id: 'username', label: '%USERNAME%', value: '{{p|username}}', helpText: 'Windows: copy this path into a folder address bar to go to this location', category: 'Windows Drive' },
    { id: 'userprofile', label: '%USERPROFILE%', value: '{{p|userprofile}}', helpText: 'Windows: copy this path into a folder address bar to go to this location', category: 'Windows Drive' },
    { id: 'documents', label: '%USERPROFILE%\\Documents', value: '{{p|userprofile\\documents}}', helpText: 'replace with My Documents for Windows XP', category: 'Windows Drive' },
    { id: 'appdata', label: '%APPDATA%', value: '{{p|appdata}}', helpText: 'Windows: copy this path into a folder address bar to go to this location', category: 'Windows Drive' },
    { id: 'locallow', label: '%USERPROFILE%\\AppData\\LocalLow', value: '{{p|userprofile\\appdata\\locallow}}', helpText: 'Windows: copy this path into a folder address bar to go to this location', category: 'Windows Drive' },
    { id: 'localappdata', label: '%LOCALAPPDATA%', value: '{{p|localappdata}}', helpText: 'Windows: copy this path into a folder address bar to go to this location', category: 'Windows Drive' },
    { id: 'temp', label: '%TEMP%', value: '{{p|temp}}', helpText: 'Windows: copy this path into a folder address bar to go to this location', category: 'Windows Drive' },
    { id: 'public', label: '%PUBLIC%', value: '{{p|public}}', helpText: 'Windows: copy this path into a folder address bar to go to this location', category: 'Windows Drive' },
    { id: 'programdata', label: '%PROGRAMDATA%', value: '{{p|programdata}}', helpText: 'Windows: copy this path into a folder address bar to go to this location', category: 'Windows Drive' },
    { id: 'allusersprofile', label: '%PROGRAMDATA%', value: '{{p|allusersprofile}}', helpText: 'Windows: copy this path into a folder address bar to go to this location', category: 'Windows Drive' },
    { id: 'programfiles', label: '%PROGRAMFILES%', value: '{{p|programfiles}}', helpText: 'Windows: copy this path into a folder address bar to go to this location', category: 'Windows Drive' },
    { id: 'windir', label: '%WINDIR%', value: '{{p|windir}}', helpText: 'Windows: copy this path into a folder address bar to go to this location', category: 'Windows Drive' },
    { id: 'syswow64', label: 'SysWOW64', value: '{{p|syswow64}}', helpText: 'Use System32 for 32-bit versions of Windows', category: 'Windows Drive' },

    // OS X
    { id: 'osxhome', label: '$HOME (macOS)', value: '{{p|osxhome}}', helpText: "Refers to the user's home folder, e.g. ~/ or /Users/user/", category: 'macOS' },

    // Linux
    { id: 'linuxhome', label: '$HOME (Linux)', value: '{{p|linuxhome}}', helpText: "Refers to the user's home folder, e.g. ~/ or /home/user/", category: 'Linux' },
    { id: 'xdgdatahome', label: '$XDG_DATA_HOME', value: '{{p|xdgdatahome}}', helpText: 'Defaults to ~/.local/share when unset', category: 'Linux' },
    { id: 'xdgconfighome', label: '$XDG_CONFIG_HOME', value: '{{p|xdgconfighome}}', helpText: 'Defaults to ~/.config when unset', category: 'Linux' }
];

// Helper to look up a path label by its format (e.g. {{p|appdata}})
export function getSpecialPathByValue(value: string): SpecialPath | undefined {
    return specialPaths.find(p => p.value.toLowerCase() === value.toLowerCase());
}
