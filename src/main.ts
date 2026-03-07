import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import Tooltip from 'primevue/tooltip';
import Ripple from 'primevue/ripple';
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
    ripple: true,
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
app.directive('ripple', Ripple);

app.mount('#app');
