const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\hp\\.gemini\\antigravity\\brain\\58ed5def-7b4d-40b1-bf2a-085b0f064b30\\.system_generated\\steps\\4\\content.md', 'utf-8');

const headings = [];
const regex = /<(h1|h2|h3)[^>]*>(.*?)<\/\1>/gi;
let match;
while ((match = regex.exec(content)) !== null) {
    const text = match[2].replace(/<[^>]*>?/gm, '').trim();
    if (text) {
        headings.push(`${match[1].toUpperCase()}: ${text}`);
    }
}
console.log(headings.join('\n'));
