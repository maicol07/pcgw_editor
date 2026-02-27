import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import Tooltip from 'primevue/tooltip';
import './style.css';
import './styles/preview/index.scss';
import './styles/preview/_icons.scss';

import App from './App.vue';

import { createPinia } from 'pinia';

const app = createApp(App);
const pinia = createPinia();

import { definePreset } from '@primeuix/themes';

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{violet.50}',
            100: '{violet.100}',
            200: '{violet.200}',
            300: '{violet.300}',
            400: '{violet.400}',
            500: '{violet.500}',
            600: '{violet.600}',
            700: '{violet.700}',
            800: '{violet.800}',
            900: '{violet.900}',
            950: '{violet.950}'
        },
        borderRadius: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '0.625rem',
            lg: '0.75rem',
            xl: '1rem',
        },
        transitionDuration: '0.15s',
        formSelect: {
            padding: {
                x: '0.5rem',
                y: '0.25rem'
            }
        },
        input: {
            padding: {
                x: '0.5rem',
                y: '0.25rem'
            }
        },
        small: {
            fontSize: '0.75rem'
        }
    },
    components: {
        panel: {
            root: {
                borderRadius: '0.75rem'
            },
            content: {
                padding: '0.5rem'
            },
            header: {
                padding: '0.375rem 0.625rem',
                borderRadius: '0.75rem 0.75rem 0 0'
            }
        },
        accordion: {
            panel: {
                header: {
                    padding: '0.5rem 0.75rem'
                }
            },
            content: {
                padding: '0.5rem 0.75rem'
            }
        },
        button: {
            root: {
                borderRadius: '0.625rem',
                padding: {
                    x: '0.625rem',
                    y: '0.313rem'
                }
            },
            sm: {
                fontSize: '0.75rem',
                padding: {
                    x: '0.5rem',
                    y: '0.25rem'
                }
            }
        },
        inputtext: {
            root: {
                borderRadius: '0.625rem',
                fontSize: '0.875rem'
            }
        },
        select: {
            root: {
                borderRadius: '0.625rem'
            }
        },
        textarea: {
            root: {
                borderRadius: '0.625rem'
            }
        },
        splitter: {
            root: {
                borderRadius: '0'
            },
            gutter: {
                width: '6px',
                background: 'transparent'
            }
        },
        toolbar: {
            root: {
                padding: '0.375rem 0.625rem',
                gap: '0.5rem'
            }
        },
        iconfield: {
            root: {
                gap: '0.5rem'
            }
        }
    }
});

app.use(pinia);
app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        options: {
            darkModeSelector: '.dark',
        }
    }
});

import Checkbox from 'primevue/checkbox';
import Select from 'primevue/select';
app.component('Checkbox', Checkbox);
app.component('Select', Select);

app.directive('tooltip', Tooltip);

app.mount('#app');
