package com.qrmanager.platform.qr;

import com.qrmanager.platform.analytics.AnalyticsService;
import com.qrmanager.platform.qr.dto.RedirectResolutionResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/qr")
@RequiredArgsConstructor
public class PublicRedirectController {

    private final AnalyticsService analyticsService;

    @GetMapping("/{shortCode}/resolve")
    public ResponseEntity<RedirectResolutionResponse> resolve(
        @PathVariable String shortCode,
        @RequestParam(value = "sig", required = false) String signature,
        HttpServletRequest request
    ) {
        return ResponseEntity.ok(new RedirectResolutionResponse(analyticsService.resolveAndTrack(shortCode, signature, request)));
    }
}
