
import { parseWikitext } from './utils/parser';
import { generateWikitext } from './utils/wikitext';

const input = `
{{Infobox game
|cover        = Eternights cover.jpg
|developers   = 
{{Infobox game/row/developer|Studio Sai}}
|publishers   = 
|engines      = 
{{Infobox game/row/engine|Unity}}
}}

To be preserved.

===[[Glossary:Save game cloud syncing|Save game cloud syncing]]===
{{Save game cloud syncing
|discord                   = 
|discord notes             = 
}}

==Game data==
{{Game data|
{{Game data/config|Windows|%USERPROFILE%\\AppData\\Local\\Eternights\\Saved\\Config\\WindowsNoEditor\\}}
}}
`;

console.log("--- Parsing ---");
const data = parseWikitext(input);
console.log("Developers parsed:", data.infobox.developers.length);
console.log("Config files parsed:", data.config.configFiles.length);

console.log("--- Generating ---");
const output = generateWikitext(data, input);

console.log("--- Output ---");
console.log(output);

// Checks
if (output.match(/Infobox game\/row\/developer/g)?.length === 1) {
    console.log("PASS: Developers count is 1");
} else {
    console.error("FAIL: Developers duplicated");
}

if (output.includes('[[Glossary:Save game cloud syncing|Save game cloud syncing]]')) {
    console.log("PASS: Cloud Sync header preserved");
} else {
    console.error("FAIL: Cloud Sync header lost");
}

if (output.includes('{{Game data/config')) {
    console.log("PASS: Game data config preserved");
} else {
    console.error("FAIL: Game data config lost");
}
