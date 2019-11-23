const nodemailer = require('nodemailer');
const getDefaultTransporterOpts = testAccount => ({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass // generated ethereal password
    }
});
async function createTransporter(opts){

    if(!opts){
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        let testAccount = await nodemailer.createTestAccount();
        opts = getDefaultTransporterOpts(testAccount);
    }

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport(opts);
    return transporter;
}
const defaultOpts = {
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: 'bar@example.com, baz@example.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world?', // plain text body
    html: '<b>Hello world?</b>' // html body
};
async function sendMail(transporter, opts = defaultOpts) {

    // send mail with defined transport object
    let info = await transporter.sendMail(opts);

    console.log('Message sent: %s', info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
module.exports = {
    sendMail,
    createTransporter,
    help: ()=>{
        const d = ['createTransporter({host,port,secure,auth{user,pass}})', 'sendMail(transporter,{from,to,subject,text,html}'];
        console.log('help:\n'+d.join('\n'));
        return d;
    }
}