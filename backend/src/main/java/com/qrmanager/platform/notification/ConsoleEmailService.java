package com.qrmanager.platform.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Console-based fallback email service for local development.
 * Logs the email content to the console instead of sending it.
 * Active by default when {@code app.mail.enabled} is not set to {@code true}.
 */
@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "false", matchIfMissing = true)
public class ConsoleEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(ConsoleEmailService.class);

    @Override
    public void sendPasswordResetEmail(String recipientEmail, String resetUrl) {
        log.info("""
            
            ╔══════════════════════════════════════════════════════════════╗
            ║                  PASSWORD RESET EMAIL                      ║
            ╠══════════════════════════════════════════════════════════════╣
            ║  To:    {}
            ║  Link:  {}
            ║                                                              ║
            ║  (Set app.mail.enabled=true and configure SMTP to send      ║
            ║   real emails in production)                                 ║
            ╚══════════════════════════════════════════════════════════════╝
            """, recipientEmail, resetUrl);
    }
}
