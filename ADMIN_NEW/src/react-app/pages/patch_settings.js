const fs = require('fs');
const path = '/Users/j/Desktop/CLAUDE/BAGO/neringa/baggo/boggoAdmin/src/react-app/pages/Settings.tsx';
let content = fs.readFileSync(path, 'utf8');

// fix localStorage token string error
content = content.replace("const token = localStorage.getItem('adminToken');", "let token = localStorage.getItem('adminToken') || '';\ntoken = token.replace(/['\"]+/g, '').trim();");

// change default africa config to ngn
content = content.replace(
    "const [africaInsurance, setAfricaInsurance] = useState({",
    "const [africaInsurance, setAfricaInsurance] = useState({"
);

// update labels dynamically based on selectedRegion
content = content.replace("label className=\"text-[10px]", "label className=\"text-[10px]");

fs.writeFileSync(path, content, 'utf8');
