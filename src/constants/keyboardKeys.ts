export const KEYBOARD_GROUPS = [
    {
        label: 'Modifiers',
        items: [
            { value: 'ctrl', label: 'Ctrl' },
            { value: 'lctrl', label: 'LCtrl' },
            { value: 'rctrl', label: 'RCtrl' },
            { value: 'alt', label: 'Alt' },
            { value: 'lalt', label: 'LAlt' },
            { value: 'ralt', label: 'RAlt' },
            { value: 'shift', label: 'Shift' },
            { value: 'lshift', label: 'LShift' },
            { value: 'rshift', label: 'RShift' },
            { value: 'win', label: 'Win' },
            { value: 'cmd', label: 'Command' },
            { value: 'opt', label: 'Option' },
            { value: 'meta', label: 'Super' },
            { value: 'menu', label: 'Menu' },
        ]
    },
    {
        label: 'Navigation',
        items: [
            { value: 'enter', label: '↵ Enter' },
            { value: 'tab', label: 'Tab ↹' },
            { value: 'backspace', label: '← Backspace' },
            { value: 'space', label: 'Space ␣' },
            { value: 'esc', label: 'Esc' },
            { value: 'del', label: 'Delete' },
            { value: 'ins', label: 'Insert' },
            { value: 'pgdn', label: 'Page Down' },
            { value: 'pgup', label: 'Page Up' },
            { value: 'print scrn', label: 'Print Screen' },
            { value: 'caps lock', label: '⇪ Caps Lock' },
        ]
    },
    {
        label: 'Arrows',
        items: [
            { value: 'up', label: '↑' },
            { value: 'down', label: '↓' },
            { value: 'left', label: '←' },
            { value: 'right', label: '→' },
        ]
    },
    {
        label: 'Symbols',
        items: [
            { value: '*', label: '*' },
            { value: '#', label: '#' },
            { value: ':', label: ':' },
            { value: '=', label: '=' },
            { value: ';', label: ';' },
            { value: '`', label: '`' },
            { value: '~', label: '~' },
            { value: ',', label: ',' },
            { value: '.', label: '.' },
        ]
    }
];

export const KEY_ALIASES: Record<string, string> = {
    'right ctrl': 'rctrl',
    'left ctrl': 'lctrl',
    'right alt': 'ralt',
    'left alt': 'lalt',
    'right shift': 'rshift',
    'left shift': 'lshift',
    'command': 'cmd',
    'option': 'opt',
    'spacebar': 'space',
    'super': 'meta',
    'start': 'win',
    'logo': 'win',
    'flag': 'win',
    'windows': 'win',
    'escape': 'esc',
    'delete': 'del',
    'insert': 'ins',
    'print screen': 'prt scrn',
    'page down': 'pgdn',
    'page up': 'pgup',
};
