import nodemailer, { Transporter } from "nodemailer";

// Define the structure of the data object expected by the function
interface MailData {
  subject: string;
  message: string;
}

// SendMail function with proper types
export async function sendMail(to: string, data: MailData): Promise<boolean> {
  // Create transporter with typed configuration
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "465", 10), // Port is cast to an integer
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // HTML email template
  const htmlTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Peregrine</title>
      <!--[if mso]>
      <noscript>
          <xml>
              <o:OfficeDocumentSettings>
                  <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
          </xml>
      </noscript>
      <![endif]-->
  </head>
  <body style="margin: 0; padding: 0; min-width: 100%; background-color: #f6f9fc;">
      <center style="width: 100%; table-layout: fixed; background-color: #f6f9fc; padding-top: 40px; padding-bottom: 40px;">
          <div style="max-width: 600px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                  <tr>
                      <td align="center" style="padding: 20px 0; background-color: #2563eb;">
                          <h1 style="color: #ffffff; font-family: 'Arial', sans-serif; margin: 0; font-size: 28px;">Peregrine</h1>
                      </td>
                  </tr>
              </table>

              <!-- Content -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                  <tr>
                      <td style="padding: 40px 30px; font-family: 'Arial', sans-serif;">
                          <h2 style="color: #1a1a1a; font-size: 24px; margin: 0 0 20px 0;">Welcome to Peregrine</h2>
                          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                              ${data.message}
                          </p>
                          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                              Best regards,<br/>
                              The Peregrine Team
                          </p>
                      </td>
                  </tr>
              </table>

              <!-- Footer -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                  <tr>
                      <td align="center" style="padding: 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                          <p style="color: #64748b; font-family: 'Arial', sans-serif; font-size: 14px; margin: 0 0 10px 0;">
                              Questions? Contact our support team
                          </p>
                          <p style="color: #64748b; font-family: 'Arial', sans-serif; font-size: 14px; margin: 0;">
                              Email us at <a href="mailto:enquiry@Peregrine.com" style="color: #2563eb; text-decoration: none;">enquiry@Peregrine.com</a>
                          </p>
                      </td>
                  </tr>
              </table>
          </div>
      </center>
  </body>
  </html>
  `;

  // Define the mail options with proper typing
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: data.subject,
    html: htmlTemplate,
  };

  try {
    // Send mail and return true on success
    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
