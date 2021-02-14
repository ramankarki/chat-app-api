const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.from = `Raman Karki <${process.env.EMAIL_FROM}>`;
    this.username = user.username;
    this.url = url;
  }

  newTransport() {
    // sendgrid
    return nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PW,
      },
    });
  }

  async send(template, subject) {
    // render html based on pug
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    // define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    // create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendActivateAccount() {
    await this.send("activateAccount", "Activate your chat-app account");
  }

  async sendResetPassword() {
    await this.send("passwordReset", "Reset password, only valid for 10 min");
  }
};
