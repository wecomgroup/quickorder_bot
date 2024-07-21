const TelegramBot = require('node-telegram-bot-api');
// 替换为你的 Telegram Bot Token
const token = '7039699071:AAG8u4zsnFwC2VE1vne8MPeqK5TUCfY9gdU';
const fs = require('fs');
const path = require('path');
const runtimePath = path.join(__dirname, './runtime');
if (!fs.existsSync(runtimePath)) {
    fs.mkdirSync(runtimePath);
}

const writeFile = (fileName, fileContent) => {
    fs.writeFileSync(path.join(runtimePath, String(fileName)), JSON.stringify(fileContent), { flag: "w" });
    return true;
}

const request = require('./request');
// 创建一个新的 Telegram bot 实例
const bot = new TelegramBot(token, { polling: true });
const replayMessage = [
    '1',
    '收到',
    '稍等',
    '好的',
    '了解',
    '马上处理',
    '已收到',
    '正在处理',
    '1',
    '1',
    '1',
    '1',
    '好的，马上',
    '稍等片刻',
    '收到，正在处理',
    '好的，请稍等',
    '马上办',
    '好的，稍等一下',
    '请稍等'
];

const dupliceMessage = [
    "你这个域名重复了",
    "重复添加了，换一组吧",
    "这个域名已经存在了",
    "该域名已经被添加过了",
    "请检查，域名重复了",
    "这个域名已经在列表中了",
    "域名重复，请重新输入",
    "该域名已经存在，请换一个",
    "重复的域名，请更换",
    "域名已存在，请检查"
];

// 监听消息事件
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    console.log(chatId);
    if (!msg.text || ![-4233373864, -1001954434985].includes(chatId)) {
        return false;
    }
    const msgList = msg.text.split('\n').map(item => item.trim()).filter(item => item);

    // 解析第一行以获取编号和事件类型
    const firstLine = msgList[0];
    const domainId = parseInt(firstLine);

    // 查找是否包含新增域名的事件
    const isAddEvent = msgList.find(item => {
        return /(新增域名|增加域名|新.域名|.增域名|新增域.)/.test(item);
    });

    if (!isNaN(domainId) && isAddEvent) {

        // 过滤出域名列表
        const domainList = msgList.slice(1).filter(item => {
            // 使用正则表达式匹配域名，确保不包含请求协议
            return /^(?!https?:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,11}$/.test(item);
        });
        if (domainList.length > 0) {
            bot.sendMessage(chatId, replayMessage[Math.floor(Math.random() * replayMessage.length)], {
                reply_to_message_id: msg.message_id
            });
            const reuslt = await request.submitBinding(domainList.join('\n'), domainId);
            if (reuslt < 0) {
                bot.sendMessage(chatId, dupliceMessage[Math.floor(Math.random() * dupliceMessage.length)], {
                    reply_to_message_id: msg.message_id
                });
            }
            writeFile(String(reuslt), {
                messageId: msg.message_id,
                chatId,
                bindId: reuslt,
                doneList: [],
                progressList: domainList,
                retry: 0
            });
        }

    } else {
        console.log('消息格式不正确或不包含新增域名事件');
    }

    console.log(domainId, isAddEvent);
});