
import iconTcTrue from '../assets/icons/tc-true.svg';
import iconTcFalse from '../assets/icons/tc-false.svg';
import iconTcUnknown from '../assets/icons/tc-unknown.svg';
import iconTcHackable from '../assets/icons/tc-hackable.svg';
import iconTcNa from '../assets/icons/tc-not-applicable.svg';

import iconInputXbox from '../assets/icons/input-xbox.svg';
import iconInputDualshock from '../assets/icons/input-dualshock.svg';
import iconInputNintendo from '../assets/icons/input-nintendo.svg';
import iconInputSteam from '../assets/icons/input-steam.svg';
import iconInputGeneric from '../assets/icons/input-generic.svg';
import iconInputUniversal from '../assets/icons/input-universal.svg';

import iconDeviceArcade from '../assets/icons/device-arcade.svg';
import iconDeviceFlight from '../assets/icons/device-flight.svg';
import iconDeviceInstruments from '../assets/icons/device-instruments.svg';
import iconDeviceSteering from '../assets/icons/device-steering.svg';

import iconOsWindows from '../assets/icons/os-windows.svg';
import iconOsMac from '../assets/icons/os-osx.svg';
import iconOsLinux from '../assets/icons/os-linux.svg';

import iconOsDos from '../assets/icons/os-dos.svg';
import iconOsWin3x from '../assets/icons/os-win3x.svg';
import iconOsMacos from '../assets/icons/os-macos.svg';
import iconOsBooter from '../assets/icons/os-booter.svg';

import iconDrmFree from '../assets/icons/drm-drm-free.svg';
import iconDrmAccount from '../assets/icons/drm-account.svg';
import iconDrmActivation from '../assets/icons/drm-activation.svg';
import iconDrmActlimit from '../assets/icons/drm-install-limit.png';
import iconDrmDisc from '../assets/icons/drm-disc.svg';
import iconDrmKey from '../assets/icons/drm-cd-key.svg';
import iconDrmOnline from '../assets/icons/drm-always-online.svg';
import iconDrmUnknown from '../assets/icons/drm-unknown.svg';
import iconDrmPhysical from '../assets/icons/drm-physical.svg';
import iconDrmFloppy from '../assets/icons/drm-floppy.svg';
import iconDrmDongle from '../assets/icons/drm-dongle.svg';
import iconDrmDownload from '../assets/icons/drm-download.svg';

import iconStoreBattlenet from '../assets/icons/store-battlenet.svg';
import iconStoreBethesda from '../assets/icons/store-bethesda.svg';
import iconStoreEpicgames from '../assets/icons/store-epicgames.svg';
import iconStoreGfwl from '../assets/icons/store-gfwl.svg';
import iconStoreGogcom from '../assets/icons/store-gogcom.svg';
import iconStoreMas from '../assets/icons/store-mas.svg';
import iconStoreMeta from '../assets/icons/store-meta.svg';
import iconStoreMicrosoft from '../assets/icons/store-microsoft.svg';
import iconStoreRockstargames from '../assets/icons/store-rockstargames.svg';
import iconStoreSteam from '../assets/icons/store-steam.svg';
import iconStoreUbisoft from '../assets/icons/store-ubisoft.svg';
import iconStoreEa from '../assets/icons/store-ea.svg';
import iconStoreTwitch from '../assets/icons/store-twitch.png';
import iconStoreGamersgate from '../assets/icons/store-gamersgate.svg';
import iconStoreHumble from '../assets/icons/store-humble.svg';

const iconTcLimited = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 250 250'%3E%3Ccircle cx='125' cy='125' r='121' fill='%231db288'/%3E%3Cpath fill='%23fff' d='m121,189c-4,5-7,8.5-14,8.5-14,0-61-51-63-57-2,-6 4,-10 8,-12 9,-5 17.5,1 23,7.5 25.5,33 34,13.5 51,-11l41.5,-61c5.5,-7.5 13,-11.5 22.5,-5 7.5,5.5 6,12 2,18.5z'/%3E%3Cpath style='fill:%23ffffff;stroke:%23f89842;stroke-width:8.22652245' d='m 116.89174,180.43528 8.9032,-27.4839 c 20.516,7.2261 35.4192,13.4841 44.7096,18.7742 -2.4517,-23.3545 -3.742,-39.419 -3.871,-48.1935 h 28.0645 c -0.3872,12.7745 -1.8711,28.7744 -4.4516,48 13.2902,-6.7095 28.516,-12.903 45.6773,-18.5807 l 8.9033,27.4839 c -16.3872,5.4195 -32.4517,9.0324 -48.1935,10.8387 7.8708,6.8389 18.9676,19.0324 33.2903,36.5806 l -23.2258,16.4515 c -7.484,-10.1933 -16.3227,-24.0642 -26.5161,-41.6128 -9.5484,18.1937 -17.9355,32.0647 -25.1613,41.6128 l -22.8386,-16.4515 c 14.9676,-18.4514 25.6773,-30.6449 32.129,-36.5806 -16.6452,-3.2256 -32.4516,-6.8385 -47.4193,-10.8387 z'/%3E%3C/svg%3E";
const iconTcAlwaysOn = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 250 250'%3E%3Ccircle cx='125' cy='125' r='121' fill='%23a0a11c'/%3E%3Crect ry='35.501' rx='35.501' height='106.501' width='71.001' y='62.874' x='89.499' fill='none' stroke='%23fff' stroke-width='17.75'/%3E%3Crect ry='8.875' rx='8.875' height='88.751' width='106.501' y='107.25' x='71.749' fill='%23fff'/%3E%3C/svg%3E";

export const iconMap = {
    tickcross: {
        'unknown': iconTcUnknown,
        'true': iconTcTrue,
        'false': iconTcFalse,
        'limited': iconTcLimited,
        'always on': iconTcAlwaysOn,
        'hackable': iconTcHackable,
        'n/a': iconTcNa,
    },
    input: {
        'xbox': iconInputXbox,
        'playstation': iconInputDualshock,
        'nintendo': iconInputNintendo,
        'steam': iconInputSteam,
        'generic': iconInputGeneric,
        'universal': iconInputUniversal,
        'nintendo switch': iconInputNintendo,
        'playstation 4': iconInputDualshock,
        'playstation 5': iconInputDualshock,
        'xbox one': iconInputXbox,
        'xbox series x|s': iconInputXbox,
    },
    device: {
        'arcade controller': iconDeviceArcade,
        'flight stick': iconDeviceFlight,
        'instruments controller': iconDeviceInstruments,
        'racing wheels': iconDeviceSteering,
    },
    os: {
        'windows': iconOsWindows,
        'windows 3.x': iconOsWin3x,
        'dos': iconOsDos,
        'mac os': iconOsMacos,
        'os x': iconOsMac,
        'macos': iconOsMac,
        'ios': iconOsMac,
        'mac app store': iconOsMac,
        'linux': iconOsLinux,
        'android': iconOsLinux,
        'pc booter': iconOsBooter,
    },
    drm: {
        'drm-free': iconDrmFree,
        'account': iconDrmAccount,
        'activation': iconDrmActivation,
        'actlimit': iconDrmActlimit,
        'disc': iconDrmDisc,
        'physical': iconDrmPhysical,
        'floppy': iconDrmFloppy,
        'dongle': iconDrmDongle,
        'key': iconDrmKey,
        'online': iconDrmOnline,
        'unknown': iconDrmUnknown,
        'download': iconDrmDownload,
    },
    store: {
        'battle.net': iconStoreBattlenet,
        'bethesda': iconStoreBethesda,
        'bethesda.net': iconStoreBethesda,
        'bethesda.net (obsolete)': iconStoreBethesda,
        'ea app': iconStoreEa,
        'origin': iconStoreEa,
        'ea desktop': iconStoreEa,
        'ea': iconStoreEa,
        'epic games launcher': iconStoreEpicgames,
        'epic games store': iconStoreEpicgames,
        'epic': iconStoreEpicgames,
        'gamersgate': iconStoreGamersgate,
        'gfwl': iconStoreGfwl,
        'gog': iconStoreGogcom,
        'gog galaxy': iconStoreGogcom,
        'goggalaxy': iconStoreGogcom,
        'gog.com': iconStoreGogcom,
        'galaxy': iconStoreGogcom,
        'humble': iconStoreHumble,
        'humble store': iconStoreHumble,
        'macapp': iconStoreMas,
        'mac app store': iconStoreMas,
        'microsoft store': iconStoreMicrosoft,
        'xbox': iconStoreMicrosoft,
        'meta store': iconStoreMeta,
        'oculus': iconStoreMeta,
        'rockstar games launcher': iconStoreRockstargames,
        'steam': iconStoreSteam,
        'twitch': iconStoreTwitch,
        'ubisoft connect': iconStoreUbisoft,
        'uplay': iconStoreUbisoft,
        'ubisoft': iconStoreUbisoft,
    }
} as const;

export type IconCategory = keyof typeof iconMap;

export const getIconSrc = (val: string, category?: IconCategory | IconCategory[]): string | undefined => {
    if (!val) return undefined;
    const v = val.toLowerCase();

    // If categories are specified, search only in those categories in the order provided
    if (category) {
        const categories = Array.isArray(category) ? category : [category];
        for (const cat of categories) {
            const map = iconMap[cat];
            if (v in map) {
                return (map as Record<string, string>)[v];
            }
        }
        return undefined;
    }

    // Default fallback order if no category is specified (preserves original general behavior)
    if (v in iconMap.os) return iconMap.os[v as keyof typeof iconMap.os];
    if (v in iconMap.store) return iconMap.store[v as keyof typeof iconMap.store];
    if (v in iconMap.drm) return iconMap.drm[v as keyof typeof iconMap.drm];
    if (v in iconMap.input) return iconMap.input[v as keyof typeof iconMap.input];
    if (v in iconMap.device) return iconMap.device[v as keyof typeof iconMap.device];
    if (v in iconMap.tickcross) return iconMap.tickcross[v as keyof typeof iconMap.tickcross];

    return undefined;
};
