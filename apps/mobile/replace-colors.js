const fs = require('fs');
const path = require('path');

const directories = ['app', 'components'];

function walkSync(currentDirPath, callback) {
  fs.readdirSync(currentDirPath).forEach((name) => {
    const filePath = path.join(currentDirPath, name);
    const stat = fs.statSync(filePath);
    if (stat.isFile() && (filePath.endsWith('.tsx') || filePath.endsWith('.ts'))) {
      callback(filePath);
    } else if (stat.isDirectory()) {
      walkSync(filePath, callback);
    }
  });
}

directories.forEach((dir) => {
  const targetDir = path.join(__dirname, dir);
  if (!fs.existsSync(targetDir)) return;
  walkSync(targetDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      .replace(/#0D9E75/gi, '#0D7377')
      .replace(/#1DCCA0/gi, '#14A085');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated:', filePath);
    }
  });
});

console.log('Done.');
