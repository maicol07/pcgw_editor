
import { describe, it, expect } from 'vitest';
import { PCGWEditor } from '../../src/utils/wikitext';
import {
    SettingsVideo,
    SettingsInput,
    SettingsAudio,
    SettingsNetwork,
    SettingsVR,
    SettingsAPI,
    GameMiddleware
} from '../../src/models/GameData';

describe('Empty Sections Generation', () => {
    const createEditor = () => new PCGWEditor('');

    interface TestCase {
        name: string;
        update: (editor: PCGWEditor) => void;
        notContain: string;
    }

    const testCases: TestCase[] = [
        {
            name: 'Video',
            update: (editor) => editor.updateVideo({
                widescreenResolution: '', multiMonitor: '', ultraWidescreen: '', fourKUltraHd: '', fov: '', windowed: '', borderlessWindowed: '',
                anisotropic: '', antiAliasing: '', upscaling: '', frameGen: '', vsync: '', fps60: '', fps120: '',
                hdr: '', rayTracing: '', colorBlind: ''
            } as any as SettingsVideo),
            notContain: '{{Video'
        },
        // Input section is now mandatory even if empty, so we skip this test.
        // {
        //     name: 'Input',
        //     update: (editor) => editor.updateInput({ ... } as any as SettingsInput),
        //     notContain: '{{Input'
        // },
        {
            name: 'Audio',
            update: (editor) => editor.updateAudio({
                separateVolume: '', surroundSound: '', subtitles: '', closedCaptions: '',
                muteOnFocusLost: '', royaltyFree: ''
            } as any as SettingsAudio),
            notContain: '{{Audio'
        },
        {
            name: 'Network',
            update: (editor) => editor.updateNetwork({
                localPlay: '', lanPlay: '', onlinePlay: '', asynchronous: '',
                crossplay: '', crossplayPlatforms: '', crossplayNotes: '',
                matchmaking: '', p2p: '', dedicated: '', selfHosting: '', directIp: '',
                tcpPorts: '', udpPorts: '', upnp: ''
            } as any as SettingsNetwork),
            notContain: '{{Network'
        },
        {
            name: 'VR',
            update: (editor) => editor.updateVR({
                native3d: '', nvidia3dVision: '', vorpx: '', vrOnly: '', openXr: '', steamVr: '', oculusVr: '',
                windowsMixedReality: '', osvr: '', keyboardMouse: '', bodyTracking: '', handTracking: '',
                faceTracking: '', eyeTracking: '', tobiiEyeTracking: '', trackIr: '', playAreaSeated: '',
                playAreaStanding: '', playAreaRoomScale: '', headsets: {}, devices: {}
            } as any as SettingsVR),
            notContain: '{{VR support'
        },
        {
            name: 'API',
            update: (editor) => editor.updateAPI({
                dxVersion: '', openGlVersion: '', softwareMode: '', mantle: '', metal: '',
                vulkanVersion: '', dosModes: '', windows32: '', windows64: '', windowsArm: '',
                macOsXPowerPc: '', macOsIntel32: '', macOsIntel64: '', macOsArm: '',
                linux32: '', linux64: '', linuxArm: ''
            } as any as SettingsAPI),
            notContain: '{{API'
        },
        {
            name: 'Middleware',
            update: (editor) => editor.updateMiddleware({
                physics: [], audio: [], interface: [], input: [], cutscenes: [],
                multiplayer: [], anticheat: []
            } as any as GameMiddleware),
            notContain: '{{Middleware'
        },
        {
            name: 'Issues Unresolved',
            update: (editor) => editor.updateIssues([], 'unresolved'),
            notContain: '{{Issues unresolved'
        },
        {
            name: 'Issues Fixed',
            update: (editor) => editor.updateIssues([], 'fixed'),
            notContain: '{{Issues fixed'
        },
        {
            name: 'System Requirements',
            update: (editor) => editor.updateSystemRequirements({
                windows: { minimum: {} as any, recommended: {} as any },
                mac: { minimum: {} as any, recommended: {} as any },
                linux: { minimum: {} as any, recommended: {} as any }
            }),
            notContain: '{{System requirements'
        }
    ];

    testCases.forEach(({ name, update, notContain }) => {
        it(`should not create ${notContain} section for ${name} if data is empty`, () => {
            const editor = createEditor();
            update(editor);
            const text = editor.getText();
            expect(text).not.toContain(notContain);

            // Additional check for header if applicable
            if (name.includes('Issues')) {
                // Should match "== Issues unresolved ==" or "== Issues fixed =="
                // Helper to match case-insensitive or exact, sticking to previous test logic
                const type = name.includes('Unresolved') ? 'unresolved' : 'fixed';
                expect(text).not.toContain(`== Issues ${type} ==`);
            }
        });
    });
});
