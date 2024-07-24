const TelegramBot = require('node-telegram-bot-api');
const utils = require('./utils');
const config=require('./config');

const request = require('./request');
// 创建一个新的 Telegram bot 实例
const bot = new TelegramBot(config.token, { polling: false });

async function main() {
    const progress = utils.readDir();

    for (let item of progress) {
        try {
            let progressData = utils.readFile(Buffer.from(item,'hex').toString('utf-8'));
            if (!Array.isArray(progressData.progressList) || progressData.progressList.length < 1) {
                // utils.unlinkSync(item);
            } else {
                const result = await request.queryBindingResult(progressData.bindId);
                const progressList = Array.from(new Set(progressData.progressList));
                if (result) {
                    if (Array.isArray(result.domains_bind) && result.domains_bind.length > 0) {
                        const newProgressList = new Set();
                        for (let domain of progressList) {
                            const info = result.domains_bind.find(self => self.name == domain);
                            if (info && info.cf_ns.length > 0) {
                                await bot.sendMessage(progressData.chatId, `${info.name}\n${info.cf_ns.join('\n')}`, {
                                    reply_to_message_id: progressData.messageId
                                });
                            } else {
                                newProgressList.add(domain);
                            }
                        }
                        progressData.progressList = Array.from(newProgressList);
                    }
                }
                if (progressData.progressList.length < 1) {
                    utils.unlinkSync(item);
                } else {
                    utils.writeFile(item, progressData);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
}

main().then(() => {
    setTimeout(process.exit, 15000);
})