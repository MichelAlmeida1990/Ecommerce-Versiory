const fs = require('fs');
let content = fs.readFileSync('components/MultiImageUpload.tsx', 'utf8');
content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"');
fs.writeFileSync('components/MultiImageUpload.tsx', content);
