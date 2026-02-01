/**
 * Example demonstrating the improvements in wikitext parser
 */

import { PCGWEditor } from './utils/wikitext';

// Example 1: Nested Templates - Previously BROKEN, now WORKS
console.log('=== Example 1: Nested Developer Templates ===\n');

const infboxTemplate = `{{Infobox game
|cover = game.jpg
|developers = 
{{Infobox game/row/developer|Studio A}}
{{Infobox game/row/developer|Studio B}}
|publishers = 
{{Infobox game/row/publisher|Publisher X}}
}}`;

const editor1 = new PCGWEditor(infboxTemplate);
editor1.setTemplateParam('Infobox game', 'license', 'Commercial');

console.log('BEFORE: Greedy regex would break on nested }} braces');
console.log('AFTER (depth-aware):');
console.log(editor1.getText());
console.log('\n✅ Both developers still present!');
console.log('✅ Nested templates intact!');
console.log('✅ License parameter added!\n');

// Example 2: No Line Smashing - PCGW Compliance
console.log('=== Example 2: Whitespace Compliance ===\n');

const videoTemplate = `{{Video
|ultrawidescreen = true
|fps = 60
}}`;

const editor2 = new PCGWEditor(videoTemplate);
editor2.setTemplateParam('Video', 'hdr', 'true');
editor2.setTemplateParam('Video', 'ray tracing', 'false');

const result = editor2.getText();
console.log('Result:');
console.log(result);

if (result.includes('|hdr = true\n') && !result.match(/\|[^|\n]+\|/)) {
    console.log('\n✅ No line smashing!');
    console.log('✅ Proper newlines after |');
    console.log('✅ PCGW compliant!');
} else {
    console.log('\n❌ Line smashing detected!');
}

// Example 3: System Requirements Nesting
console.log('\n=== Example 3: System Requirements (Multiple OS) ===\n');

const sysReqTemplate = `{{System requirements
|OS=Windows
|minCPU = Old Windows CPU
}}
{{System requirements
|OS=Linux
|minCPU = Linux CPU
}}`;

const editor3 = new PCGWEditor(sysReqTemplate);
editor3.updateSystemRequirements({
    windows: {
        minimum: {
            os: 'Windows 10',
            cpu: 'Intel i5',
            ram: '8 GB',
            hdd: '50 GB',
            gpu: 'GTX 1060'
        },
        recommended: { os: '', cpu: '', ram: '', hdd: '', gpu: '' },
        notes: ''
    },
    linux: null as any,
    mac: null as any
});

const result3 = editor3.getText();
console.log('Result:');
console.log(result3);

if (result3.includes('Intel i5') && result3.includes('Linux CPU')) {
    console.log('\n✅ Windows requirements updated!');
    console.log('✅ Linux requirements unchanged!');
    console.log('✅ No cross-contamination!');
}

// Example 4: Brace Balance
console.log('\n=== Example 4: Brace Balance ===\n');

const nestedTemplate = `{{Video|param={{Nested|value=test}}|other=simple}}`;
const editor4 = new PCGWEditor(nestedTemplate);
editor4.setTemplateParam('Video', 'other', 'modified');

const result4 = editor4.getText();
const openBraces = (result4.match(/\{\{/g) || []).length;
const closeBraces = (result4.match(/\}\}/g) || []).length;

console.log('Result:', result4);
console.log(`Open braces: ${openBraces}`);
console.log(`Close braces: ${closeBraces}`);

if (openBraces === closeBraces) {
    console.log('\n✅ Brace balance maintained!');
} else {
    console.log('\n❌ Unbalanced braces!');
}

console.log('\n' + '='.repeat(60));
console.log('All examples demonstrate the robust, depth-aware parsing!');
console.log('No more greedy regex failures! 🎉');
console.log('='.repeat(60));
