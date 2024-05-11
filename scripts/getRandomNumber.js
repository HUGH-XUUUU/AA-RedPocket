const crypto = require('crypto');

// 生成一个指定字节长度的随机数
function generateRandomNumber(byteLength) {
    // 使用crypto模块的randomBytes方法
    return crypto.randomBytes(byteLength);
}

// 生成一个256位（32字节）的随机数
const randomNumber = generateRandomNumber(32);
console.log('Random Number:', randomNumber.toString('hex'));