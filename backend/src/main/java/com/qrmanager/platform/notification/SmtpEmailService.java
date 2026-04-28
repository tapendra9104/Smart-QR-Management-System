package com.qrmanager.platform.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Sends real emails via SMTP using Spring Mail.
 * Activated when {@code app.mail.enabled=true}.
 */
@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
public class SmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public SmtpEmailService(JavaMailSender mailSender,
                            org.springframework.core.env.Environment env) {
        this.mailSender = mailSender;
        this.fromAddress = env.getProperty("app.mail.from-address", "noreply@qrmanager.app");
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String recipientEmail, String resetUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(recipientEmail);
            helper.setSubject("Reset your QR Manager password");
            helper.setText(buildPasswordResetHtml(resetUrl), true);

            mailSender.send(message);
            log.info("Password reset email sent to {}", recipientEmail);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send password reset email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    private String buildPasswordResetHtml(String resetUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;">
                    <tr>
                        <td style="background:#ffffff;border-radius:12px;padding:40px;border:1px solid #e4e4e7;">
                            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#09090b;">Reset your password</h1>
                            <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.6;">
                                We received a request to reset the password for your QR Manager account.
                                Click the button below to choose a new password.
                            </p>
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                                <tr>
                                    <td style="border-radius:8px;background:#18181b;">
                                        <a href="%s" target="_blank" style="display:inline-block;padding:12px 28px;color:#fafafa;font-size:15px;font-weight:600;text-decoration:none;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0 0 4px;color:#71717a;font-size:13px;line-height:1.5;">
                                This link will expire in 1 hour.
                            </p>
                            <p style="margin:0 0 16px;color:#71717a;font-size:13px;line-height:1.5;">
                                If you didn't request this, you can safely ignore this email.
                            </p>
                            <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
                            <p style="margin:0;color:#a1a1aa;font-size:12px;">
                                If the button doesn't work, copy and paste this URL into your browser:
                            </p>
                            <p style="margin:4px 0 0;word-break:break-all;color:#a1a1aa;font-size:12px;">
                                %s
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 0;text-align:center;color:#a1a1aa;font-size:12px;">
                            &copy; QR Manager &mdash; Sent automatically, please do not reply.
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(resetUrl, resetUrl);
    }
}
