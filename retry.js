const TelegramBot = require('node-telegram-bot-api');
const token = '7039699071:AAG8u4zsnFwC2VE1vne8MPeqK5TUCfY9gdU';
const fs = require('fs');
const path = require('path');
const runtimePath = path.join(__dirname, './runtime');
if (!fs.existsSync(runtimePath)) {
    fs.mkdirSync(runtimePath);
}

const readFile = (fileName) => {
    const fileContent = fs.readFileSync(path.join(runtimePath, String(fileName)), { encoding: "utf-8" });
    try {
        const params = JSON.parse(fileContent);
        return params
    } catch (error) {
        fs.unlinkSync(path.join(runtimePath, String(fileName)));
        return null;
    }
}

const writeFile = (fileName, fileContent) => {
    fs.writeFileSync(path.join(runtimePath, String(fileName)), JSON.stringify(fileContent), { flag: "w" });
    return true;
}

const request = require('./request');
// 创建一个新的 Telegram bot 实例
const bot = new TelegramBot(token, { polling: false });

async function main() {
    const progress = fs.readdirSync(runtimePath);

    for (let item of progress) {
        try {
            let progressData = readFile(item);
            const result = await request.queryBindingResult(progressData.bindId);
            if (result) {
                if (Array.isArray(result.domains_bind) && result.domains_bind.length > 0) {
                    const progressList = [];
                    for (let domain of result.domains_bind) {
                        if (progressData.progressList.includes(domain.name) && domain.cf_ns.length > 0) {
                            await bot.sendMessage(progressData.chatId, `${domain.name}\n${domain.cf_ns.join('\n')}`, {
                                reply_to_message_id: progressData.messageId
                            });
                            progressData.doneList.push(domain.name);
                        } else {
                            progressList.push(domain.name);
                        }
                    }
                    progressData.progressList = progressList;
                }
            }
            if (progressData.progressList.length < 1) {
                fs.unlinkSync(path.join(runtimePath, String(item)));
            } else {
                writeFile(item, progressData);
            }
        } catch (error) {
            console.error(error);
        }
    }
}

main().then(() => {
    setTimeout(process.exit, 15000);
})