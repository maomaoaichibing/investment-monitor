const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: '3416067293@qq.com',
    pass: 'tvirprqplhejcabe'
  }
});
transporter.verify().then(r => {
  console.log('SMTP验证成功:', r);
  process.exit(0);
}).catch(e => {
  console.error('SMTP验证失败:', e.message);
  process.exit(1);
});