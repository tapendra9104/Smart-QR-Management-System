package com.qrmanager.platform.integration;

import com.qrmanager.platform.common.BadRequestException;
import com.qrmanager.platform.integration.apikey.ApiKeyRepository;
import com.qrmanager.platform.integration.webhook.WebhookRepository;
import com.qrmanager.platform.qr.QrCodeRepository;
import com.qrmanager.platform.user.User;
import com.qrmanager.platform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsageLimitService {

    private static final int DEFAULT_MAX_QR_CODES = 500;
    private static final int DEFAULT_MAX_API_KEYS = 10;
    private static final int DEFAULT_MAX_WEBHOOKS = 10;

    private final UserRepository userRepository;
    private final QrCodeRepository qrCodeRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final WebhookRepository webhookRepository;

    public void assertCanCreateQrCode(UUID userId) {
        User user = requireUser(userId);
        long currentCount = qrCodeRepository.countByUserId(userId);
        int limit = user.getMaxQrCodes() != null ? user.getMaxQrCodes() : DEFAULT_MAX_QR_CODES;
        if (currentCount >= limit) {
            throw new BadRequestException("QR code limit reached for this workspace");
        }
    }

    public void assertCanCreateApiKey(UUID userId) {
        User user = requireUser(userId);
        long currentCount = apiKeyRepository.countByUserIdAndRevokedAtIsNull(userId);
        int limit = user.getMaxApiKeys() != null ? user.getMaxApiKeys() : DEFAULT_MAX_API_KEYS;
        if (currentCount >= limit) {
            throw new BadRequestException("API key limit reached for this workspace");
        }
    }

    public void assertCanCreateWebhook(UUID userId) {
        User user = requireUser(userId);
        long currentCount = webhookRepository.countByUserIdAndActiveTrue(userId);
        int limit = user.getMaxWebhooks() != null ? user.getMaxWebhooks() : DEFAULT_MAX_WEBHOOKS;
        if (currentCount >= limit) {
            throw new BadRequestException("Webhook limit reached for this workspace");
        }
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));
    }
}
