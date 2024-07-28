const TelegramBot = require('node-telegram-bot-api');
// 替换为你的 Telegram Bot Token
// const token = '7039699071:AAG8u4zsnFwC2VE1vne8MPeqK5TUCfY9gdU';
const config = require('./config');
const utils = require('./utils');


const request = require('./request');
// 创建一个新的 Telegram bot 实例
const bot = new TelegramBot(config.token, { polling: true });
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

function parseMessage(msg) {
    const chatId = msg.chat.id;
    const msgList = msg.text.split('\n').map(item => item.trim()).filter(item => item);
    // 解析第一行以获取编号和事件类型
    let firstLine = msgList.find(item => !isNaN(item));
    // 查找是否包含新增域名的事件
    let isAddEvent = msgList.find(item => {
        return /(新增域名|增加域名|新.域名|.增域名|新增域.)/.test(item);
    });
    if (!firstLine) {
        let matchMsg = msgList.find(item => /^(\d+)?.*新增域名(\s+)?$/.test(item));
        if (matchMsg) {
            firstLine = matchMsg.replace(/\D/g, '');
            isAddEvent = true;
        } else {
            matchMsg = msgList.find(item => /^新增域名\s?\d.*$/.test(item));
            if (matchMsg) {
                firstLine = matchMsg.replace(/\D/g, '');
                isAddEvent = true;
            }
        }
    }

    const domainId = parseInt(firstLine);
    if (isNaN(domainId) || !isAddEvent) {
        return false;
    }
    // 过滤出域名列表
    const domainList = msgList.slice(1).filter(item => {
        // 使用正则表达式匹配域名，确保不包含请求协议
        return /^(?!https?:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,11}$/.test(item);
    });

    return domainList.length > 0 ? { domainId, domainList } : false;
}

async function handler(msg) {
    const msgInfo = parseMessage(msg);
    if (msgInfo) {
        await postDomain(msg, msgInfo);
    }
    return true;
}

async function postDomain(msg, msgInfo) {
    const chatId = msg.chat.id;
    const fileName = `${msg.chat.id}:${msg.message_id}`;
    msgInfo.createAt = new Date().getTime();
    utils.writeFile(fileName, msgInfo, true);
    bot.sendMessage(chatId, replayMessage[Math.floor(Math.random() * replayMessage.length)], {
        reply_to_message_id: msg.message_id
    });
    const reuslt = await request.submitBinding(msgInfo.domainList.join('\n'), msgInfo.domainId);
    if (reuslt < 0) {
        bot.sendMessage(chatId, dupliceMessage[Math.floor(Math.random() * dupliceMessage.length)], {
            reply_to_message_id: msg.message_id
        });
    } else {
        utils.writeFile(reuslt, {
            messageId: msg.message_id,
            chatId,
            bindId: reuslt,
            doneList: [],
            progressList: msgInfo.domainList.map(item=>String(item).toLowerCase()),
            retry: 0
        });
    }
}

bot.on('edited_message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text || !config.writeList.includes(chatId)) {
        // 不在百名單不給處理
        return false;
    }
    if(new Date().getTime()/1000-msg.date>10*60){
        // 超過10分鐘的消息不予處理
        return false; 
    }
    const fileName =`${msg.chat.id}:${msg.message_id}`;
    const cache = utils.readFile(fileName,true);
    console.log(fileName,cache);
    // 不存在緩存則證明之前沒有匹配到
    if (!cache) {
        await handler(msg);
    } else {
        // 存在緩存則有可能匹配部分域名
        let msgInfo = parseMessage(msg);
        if (msgInfo) {
            // 站點id不同
            if (msgInfo.domainId !== cache.domainId) {
                // GG
                return false;
            }
            // 匹配出未被添加的記錄
            const newDomainList = msgInfo.domainList.filter(item => !cache.domainList.includes(item));
            console.log(newDomainList);
            if (newDomainList) {
                msgInfo.domainList = newDomainList;
                await postDomain(msg, msgInfo);
            }
        }
    }
})

// 监听消息事件
bot.on('message', async (msg) => {
    console.log(msg.date);
    const chatId = msg.chat.id;
    if (!msg.text || !config.writeList.includes(chatId)) {
        return false;
    }
    await handler(msg);
});