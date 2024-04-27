import { createTransport, type Transporter } from "nodemailer";
import { Result } from "./result";

const config = {
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "kamron.shields@ethereal.email",
    pass: "ECGcCa7dyzrQcrRFjf",
  },
};

export class Emailer {
  private static instance: Emailer;
  private transporter: Transporter;

  private constructor() {
    this.transporter = createTransport(config);
  }

  static getInstance = () => {
    if (!this.instance) {
      this.instance = new Emailer();
    }
    return this.instance;
  };

  public sendEmail = async (
    to: string,
    {
      subject,
      htmlContent,
    }: {
      subject: string;
      htmlContent: string;
    }
  ) => {
    try {
      console.log("not sending email to actual address:", to);
      const res = await this.transporter.sendMail({
        from: config.auth.user,
        to: config.auth.user,
        subject,
        html: htmlContent,
      });
      console.log("sent email", res);
      return new Result(res.messageId);
    } catch (err) {
      console.error("Could not send email", { to, subject });
      console.error(err);
      return Result.error("Could not send email");
    }
  };
}
