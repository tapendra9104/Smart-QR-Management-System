package com.qrmanager.platform.notification;

/**
 * Service for sending email notifications (password reset links, alerts, etc.).
 */
public interface EmailService {

    /**
     * Send a password reset email to the specified address.
     *
     * @param recipientEmail the user's email address
     * @param resetUrl       the full URL the user should click to reset their password
     */
    void sendPasswordResetEmail(String recipientEmail, String resetUrl);
}
