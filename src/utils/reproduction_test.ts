
import { renderWikitextToHtml } from './renderer';

const input = `
Configuration file(s) location
{{Game data| {{Game data/config|Windows|{{p|userprofile\\appdata\\locallow}} }} }}
Save game data location
{{Game data| {{Game data/saves|Windows|{{p|userprofile\\appdata\\locallow}} }} }}
Save game cloud syncing
{{Save game cloud syncing |discord = unknown |discord notes = |epic games launcher = false |epic games launcher notes = |gog galaxy = unknown |gog galaxy notes = |ea app = unknown |ea app notes = |steam cloud = true |steam cloud notes = |ubisoft connect = unknown |ubisoft connect notes = |xbox cloud = unknown |xbox cloud notes = }}
`;

const output = renderWikitextToHtml(input);

// Helpers
const assertContains = (text: string, substring: string, name: string) => {
    if (!text.includes(substring)) {
        console.error(`FAILED: ${name} check.`);
        console.error(`Expected to find: ${substring}`);
        return false;
    }
    console.log(`PASSED: ${name} check.`);
    return true;
};

console.log("--- Testing HTML Structure ---");

// Game Data (Config)
assertContains(output, 'class="container-pcgwikitable"', 'Container Wrapper');
assertContains(output, 'id="table-gamedata"', 'Game Data Table ID');
assertContains(output, 'Configuration file(s) location', 'Config Header');
assertContains(output, '%USERPROFILE%', 'Start of Path expansion'); // Expecting {{p|...}} to be parsed

// Cloud Sync
assertContains(output, 'id="table-cloudsync"', 'Cloud Sync Table ID');
assertContains(output, 'class="pcgwikitable template-infotable template-gamedata"', 'Cloud Sync Classes');


console.log("--- Full Output Snippet ---");
console.log(output);
