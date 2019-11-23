const { createTransporter, sendMail } = require("./utils/mailer.js");
const clientHasJavaScriptEnabled = require("./utils/clientHasJavaScriptEnabled.js");
function contactFormLogicFactory({ emailTransporter }) {
  return async function contactFormLogic(req, res) {
    //emailTransporter should be in memory, but if not, get it
    if (!emailTransporter) {
      console.warn(
        "email transporter not detected, getting new transporter..."
      );
      emailTransporter = await createTransporter();
    }
    console.log("/contact req body", req.body);
    const name = req.body.name || "-no-name-supplied-";
    const emailAddress = req.body.emailAddress;
    const message = req.body.message;
    let emailResponseInfo;
    let emailResponseError;
    //email address and message required...
    if (emailAddress && message) {
      try {
        emailResponseInfo = await sendMail(emailTransporter, {
          from: emailAddress,
          to: "campbell.goe@gmail.com",
          subject: `Message via contact form sent by ${name} at ${new Date().toLocaleString(
            "en-GB",
            { timeZone: "UTC" }
          )} from ${req.protocol}://${req.hostname}`,
          text: message
        });
        console.log("message sent", emailResponseInfo);
      } catch (err) {
        emailResponseError = err.toString();
        console.error("email not sent:\n", err);
      }
    }
    //use nodemailer to determine if this email address exists.
    const resData = {};

    if (emailResponseError) {
      resData.error = emailResponseError;
      resData.success = false;
      res.status(503);
    } else {
      res.status(200);
      resData.success = true;
      if (emailResponseInfo) {
        resData.info = emailResponseInfo;
      }
    }

    if (clientHasJavaScriptEnabled(req)) {
      //can send json response
      return res.json(resData);
    }
    console.log("client does not have javascript enabled");
    //user has javascript disabled, respond with the page html and pass in relevant data
    //warning, make sure resData is not too large e.g. max 2000 chars.
    //take to home page (change this bit if contact form is on another page)
    //need to send data somehow e.g. redirect and render with toast notificaiton
    //`?contactResponse=${encodeURIComponent(JSON.stringify(resData))}#contact`
    return res.redirect(`/#contact` + (resData.error ? "?error=true" : ""));
  };
}
module.exports = contactFormLogicFactory;
