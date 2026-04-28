package com.qrmanager.platform.qr;

import com.qrmanager.platform.common.ResourceNotFoundException;
import com.qrmanager.platform.config.AppProperties;
import io.jsonwebtoken.io.Encoders;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Objects;

@Service
public class RedirectUrlSigner {

    private final SecretKey secretKey;
    private final AppProperties appProperties;

    public RedirectUrlSigner(AppProperties appProperties) {
        this.appProperties = appProperties;
        try {
            byte[] keyBytes = MessageDigest.getInstance("SHA-256")
                .digest(appProperties.redirectSigningSecret().getBytes(StandardCharsets.UTF_8));
            this.secretKey = new SecretKeySpec(keyBytes, "HmacSHA256");
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Unable to initialize QR redirect signer", exception);
        }
    }

    public String buildSignedResolveUrl(String frontendUrl, String shortCode) {
        return frontendUrl.replaceAll("/+$", "") + "/r/" + shortCode + "?sig=" + signatureFor(shortCode);
    }

    public void validate(String shortCode, String signature) {
        if (!appProperties.requireSignedRedirects()) {
            return;
        }

        if (signature == null || signature.isBlank() || !Objects.equals(signature, signatureFor(shortCode))) {
            throw new ResourceNotFoundException("QR code not found");
        }
    }

    public String signatureFor(String shortCode) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKey);
            return Encoders.BASE64URL.encode(mac.doFinal(shortCode.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign QR redirect URL", exception);
        }
    }
}
