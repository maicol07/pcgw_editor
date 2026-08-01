import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import vueTsConfigs from '@vue/eslint-config-typescript';
import pluginA11y from 'eslint-plugin-vuejs-accessibility';

// Deliberately narrow. The point is not style — that is what the type checker and review are for —
// but to make the specific classes of defect this codebase actually had fail automatically:
//   * unsanitized v-html (the XSS that reached innerHTML)
//   * labels with no associated control (~98 of them)
//   * icon-only buttons whose only name was a v-tooltip
// Everything stylistic is off, so `pnpm lint` stays a signal rather than noise.
export default [
    { ignores: ['dist/**', 'dev-dist/**', 'node_modules/**', 'coverage/**', 'worker.js', '*.tsbuildinfo'] },

    js.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    ...vueTsConfigs(),
    ...pluginA11y.configs['flat/recommended'],

    {
        rules: {
            // --- what the audit actually found ---
            'vue/no-v-html': 'warn',                       // each use must be justified; see utils/sanitize.ts
            'vuejs-accessibility/label-has-for': ['warn', { required: { some: ['nesting', 'id'] } }],
            'vuejs-accessibility/form-control-has-label': 'warn',
            'vuejs-accessibility/anchor-has-content': 'warn',
            'vuejs-accessibility/click-events-have-key-events': 'warn',
            'vuejs-accessibility/mouse-events-have-key-events': 'warn',

            // --- correctness ---
            'vue/require-v-for-key': 'error',
            'vue/no-mutating-props': 'error',
            'vue/valid-v-memo': 'error',   // v-memo inside v-for is a silent no-op
            'vue/valid-v-slot': 'error',    // two templates for one slot: one is silently dropped
            'no-empty': ['error', { allowEmptyCatch: true }],

            // Flags `let x = false` followed by an assignment in every branch. That is defensive
            // initialisation, not a defect, and it fired 11 times on deliberate code.
            'no-useless-assignment': 'off',

            // These are intentional global registrations of PrimeVue/openvue components in main.ts
            // (app.component('Select', …)). Renaming them would touch every template for no gain.
            'vue/multi-word-component-names': 'off',
            'vue/no-reserved-component-names': 'off',

            // Accessibility findings are real but form a backlog of their own (~100 unlabelled
            // controls, icon-only buttons named only by v-tooltip). They stay visible as warnings
            // so `pnpm lint` reports them, while CI gates on errors — otherwise the whole suite
            // would be red from day one and nobody would run it.
            'vuejs-accessibility/alt-text': 'warn',
            'vuejs-accessibility/no-static-element-interactions': 'warn',
            'vuejs-accessibility/no-autofocus': 'warn',
            'vuejs-accessibility/interactive-supports-focus': 'warn',

            // A bare @ts-ignore hides an error forever; @ts-expect-error fails once it is fixed.
            '@typescript-eslint/prefer-ts-expect-error': 'off', // superseded by the rule below
            '@typescript-eslint/ban-ts-comment': ['warn', {
                'ts-ignore': true,
                'ts-expect-error': 'allow-with-description',
                minimumDescriptionLength: 5,
            }],

            // --- off on purpose ---
            // `any` is pervasive (mostly src/utils/parser.ts, whose wikiparser-node AST is untyped).
            // Erroring here would bury every other finding; typing that AST is tracked separately.
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',      // tsconfig noUnusedLocals already covers this
            // Pure formatting from vue/flat/recommended. ~776 hits, none of which say anything
            // about whether the code works — they would drown the findings that matter.
            'vue/max-attributes-per-line': 'off',
            'vue/singleline-html-element-content-newline': 'off',
            'vue/multiline-html-element-content-newline': 'off',
            'vue/html-indent': 'off',
            'vue/html-self-closing': 'off',
            'vue/attributes-order': 'off',
            'vue/first-attribute-linebreak': 'off',
            'vue/html-closing-bracket-newline': 'off',
            'vue/attribute-hyphenation': 'off',
            'vue/v-on-event-hyphenation': 'off',
            'vue/mustache-interpolation-spacing': 'off',
            'vue/block-order': 'off',
            'vue/require-default-prop': 'off',
        },
    },

    {
        // Tests legitimately reach into private members and build deliberately malformed fixtures,
        // so the ts-comment and a11y rules are not useful signal there.
        files: ['tests/**/*.ts'],
        rules: {
            'vue/one-component-per-file': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            'vuejs-accessibility/label-has-for': 'off',
            'vuejs-accessibility/form-control-has-label': 'off',
        },
    },
];
