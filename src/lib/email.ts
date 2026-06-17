import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
})

const FROM = process.env.SMTP_FROM || "noreply@ins.app"

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`)
    return
  }
  await transporter.sendMail({ from: FROM, to, subject, html })
}

export function invoiceEmail({ invoiceNumber, customerName, amount, dueDate, orgName }: { invoiceNumber: string; customerName: string; amount: number; dueDate: string; orgName: string }) {
  return {
    subject: `Invoice ${invoiceNumber} from ${orgName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#6366f1;color:white;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;">${orgName}</h1>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;">
          <h2 style="margin:0 0 16px;color:#111827;">Invoice ${invoiceNumber}</h2>
          <p style="color:#6b7280;margin:0 0 8px;">Dear ${customerName},</p>
          <p style="color:#6b7280;margin:0 0 16px;">A new invoice has been issued for your account.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tr><td style="padding:8px 0;color:#6b7280;">Amount Due</td><td style="padding:8px 0;font-weight:600;text-align:right;">$${amount.toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb;">Due Date</td><td style="padding:8px 0;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;">${dueDate}</td></tr>
          </table>
          <a href="${process.env.NEXTAUTH_URL}/invoices" style="display:inline-block;background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;">View Invoice</a>
        </div>
      </div>
    `,
  }
}

export function resetPasswordEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return {
    subject: "Reset your password",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="margin:0 0 16px;color:#111827;">Password Reset</h2>
          <p style="color:#6b7280;margin:0 0 8px;">Hi ${name},</p>
          <p style="color:#6b7280;margin:0 0 16px;">Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Reset Password</a>
        </div>
      </div>
    `,
  }
}

export function notificationEmail({ title, message, link, orgName }: { title: string; message: string; link?: string; orgName: string }) {
  return {
    subject: `${title} — ${orgName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="margin:0 0 8px;color:#111827;">${title}</h2>
          <p style="color:#6b7280;margin:0 0 16px;">${message}</p>
          ${link ? `<a href="${process.env.NEXTAUTH_URL}${link}" style="display:inline-block;background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;">View</a>` : ""}
        </div>
      </div>
    `,
  }
}
