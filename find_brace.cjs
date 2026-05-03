const fs = require('fs');
const code = fs.readFileSync('./components/AdminDashboard.tsx', 'utf8');
const lines = code.split('\n');

// Print cumulative balance every 200 lines
let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const c of line) {
    if (c === '{') balance++;
    if (c === '}') balance--;
  }
  if ((i + 1) % 500 === 0) {
    console.log(`Line ${i + 1}: balance = ${balance}`);
  }
}
console.log(`Line ${lines.length}: final balance = ${balance}`);
