import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import Tooltip from 'primevue/tooltip';
import ToastService from 'primevue/toastservice';
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
            50: '#f0f6fc',
            100: '#dceafa',
            200: '#bcd6f1',
            300: '#8fbce5',
            400: '#5b9ad4',
            500: '#337abe',
            600: '#2c66a3',
            700: '#275788',
            800: '#264a6f',
            900: '#233e5c',
            950: '#18293d'
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
        toolbar: {
            root: {
                padding: '0.375rem 0.625rem',
                gap: '0.5rem'
            }
        }
    }
});

app.use(pinia);
app.use(PrimeVue, {
    ripple: false,
    theme: {
        preset: MyPreset,
        options: {
            darkModeSelector: '.dark',
        }
    }
});
app.use(ToastService);

import Checkbox from 'primevue/checkbox';
import Select from 'primevue/select';
app.component('Checkbox', Checkbox);
app.component('Select', Select);

app.directive('tooltip', Tooltip);

app.mount('#app');
