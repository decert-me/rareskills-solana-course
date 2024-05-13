const fs = require('fs');

// 待生成文件的数量
const numFiles = 30;

// 循环生成文件
for (let i = 1; i <= numFiles; i++) {
    const fileName = `chapter_${i}.md`;
    
    // 写入文件内容
    fs.writeFile(fileName, `# Chapter ${i}\nContent for chapter ${i}`, (err) => {
        if (err) {
            console.log(`Error creating file ${fileName}: ${err}`);
        } else {
            console.log(`Created file: ${fileName}`);
        }
    });
}