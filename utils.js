const fs = require('fs');
const path = require('path');
const runtimePath = path.join(__dirname, './runtime');
require('date-format-lite');

const getFullPath = function (dayly) {
    let logPath = dayly ? path.join(runtimePath, new Date().format('YYYYMMDD')) : path.join(runtimePath, 'cache');
    return logPath;
}

const writeFile = (fileName, fileContent, dayly = false) => {
    let logPath = getFullPath(dayly);
    if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
    }
    fs.writeFileSync(path.join(logPath, Buffer.from(String(fileName),'utf-8').toString('hex')), JSON.stringify(fileContent,null,2), { flag: "w" });
    return true;
}

const readFile = (fileName, dayly = false) => {
    let logPath = getFullPath(dayly);
    const filePath = path.join(logPath, Buffer.from(String(fileName),'utf-8').toString('hex'));
    if (!fs.existsSync(filePath)) {
        return false;
    }
    const fileContent = fs.readFileSync(filePath, { encoding: "utf-8" });
    try {
        const params = JSON.parse(fileContent);
        return params
    } catch (error) {
        fs.unlinkSync(filePath);
        return null;
    }
}

const readDir = (dir) => {
    let readPath = dir ? path.join(runtimePath, dir) : path.join(runtimePath, 'cache');
    return fs.readdirSync(readPath);
}

const unlinkSync = (fileName, dayly = false) => {
    let logPath = getFullPath(dayly);
    let readPath = path.join(logPath, fileName);
    return fs.unlinkSync(readPath);
}


module.exports = {
    writeFile,
    readFile,
    readDir,
    unlinkSync
}