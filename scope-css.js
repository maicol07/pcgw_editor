
import postcss from 'postcss';
import fs from 'fs';
import path from 'path';

const files = [
    'src/styles/preview/style1.scss',
    'src/styles/preview/style2.scss'
];

const scopePlugin = (opts = {}) => {
    return {
        postcssPlugin: 'add-scope',
        Rule(rule) {
            // Avoid double scoping if already scoped (unlikely)
            // Also avoid scoping keyframes tokens (PostCSS handles this usually, but checking)
            if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') {
                return;
            }

            rule.selectors = rule.selectors.map(selector => {
                if (selector.includes('.mw-parser-output')) return selector;
                // HTML and body should probably be replaced or scoped carefully
                // But for now, just prepend. 
                // If selector is 'body', '.mw-parser-output body' -> matches body inside wrapper? No.
                // We want '.mw-parser-output' to behave AS the body/root.
                // Replace 'body' with '&'? No, PostCSS isn't nesting.
                // If selector is 'body', we might want just '.mw-parser-output'.
                if (selector === 'body') return '.mw-parser-output';
                if (selector === 'html') return '.mw-parser-output';

                return `.mw-parser-output ${selector}`;
            });
        }
    };
};
scopePlugin.postcss = true;

async function processFile(filePath) {
    const css = fs.readFileSync(filePath, 'utf8');
    const result = await postcss([scopePlugin()]).process(css, { from: filePath });

    const newPath = filePath.replace('.scss', '_scoped.css');
    fs.writeFileSync(newPath, result.css);
    console.log(`Processed ${filePath} -> ${newPath}`);
}

(async () => {
    for (const file of files) {
        await processFile(file);
    }
})();
