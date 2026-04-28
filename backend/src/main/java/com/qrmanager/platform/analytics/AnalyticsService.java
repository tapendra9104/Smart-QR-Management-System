package com.qrmanager.platform.analytics;

import com.qrmanager.platform.analytics.dto.AnalyticsOverviewResponse;
import com.qrmanager.platform.analytics.dto.DailyScanPoint;
import com.qrmanager.platform.analytics.dto.DeviceBreakdownItem;
import com.qrmanager.platform.analytics.dto.QrAnalyticsResponse;
import com.qrmanager.platform.analytics.dto.RecentScanResponse;
import com.qrmanager.platform.analytics.dto.TopPerformingQrResponse;
import com.qrmanager.platform.common.ResourceNotFoundException;
import com.qrmanager.platform.qr.RedirectUrlSigner;
import com.qrmanager.platform.qr.QrCodeEntity;
import com.qrmanager.platform.qr.QrCodeRepository;
import com.qrmanager.platform.qr.QrCodeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final List<String> KNOWN_BOT_MARKERS = List.of(
        "bot",
        "crawler",
        "spider",
        "facebookexternalhit",
        "slackbot",
        "discordbot",
        "telegrambot",
        "whatsapp",
        "linkedinbot",
        "twitterbot",
        "googlebot",
        "bingbot"
    );

    private final ScanEventRepository scanEventRepository;
    private final QrCodeRepository qrCodeRepository;
    private final QrCodeService qrCodeService;
    private final RedirectUrlSigner redirectUrlSigner;
    private final ScanEventPublisher scanEventPublisher;
    private final ObjectProvider<ClickHouseAnalyticsStore> clickHouseAnalyticsStoreProvider;

    public AnalyticsOverviewResponse getOverview(UUID userId) {
        List<QrCodeEntity> codes = qrCodeRepository.findByUserIdOrderByCreatedAtDesc(userId);
        ClickHouseAnalyticsStore clickHouseAnalyticsStore = clickHouseAnalyticsStoreProvider.getIfAvailable();

        if (clickHouseAnalyticsStore != null) {
            long totalScans = clickHouseAnalyticsStore.countByUserId(userId);
            long todayScans = clickHouseAnalyticsStore.countRecentByUserId(userId, Instant.now().minusSeconds(86_400));
            long weekScans = clickHouseAnalyticsStore.countRecentByUserId(userId, Instant.now().minusSeconds(604_800));
            long uniqueCountries = clickHouseAnalyticsStore.countUniqueCountriesByUserId(userId);
            long mobileScans = clickHouseAnalyticsStore.countByUserIdAndDeviceType(userId, "mobile");
            long desktopScans = clickHouseAnalyticsStore.countByUserIdAndDeviceType(userId, "desktop");

            List<TopPerformingQrResponse> topCodes = codes.stream()
                .sorted(Comparator.comparingLong(QrCodeEntity::getTotalScans).reversed())
                .limit(5)
                .map(code -> new TopPerformingQrResponse(code.getId(), code.getName(), code.getTotalScans()))
                .toList();

            return new AnalyticsOverviewResponse(
                codes.size(),
                totalScans,
                todayScans,
                weekScans,
                uniqueCountries,
                mobileScans,
                desktopScans,
                clickHouseAnalyticsStore.chartDataByUserId(userId),
                buildDeviceData(totalScans, mobileScans, desktopScans),
                topCodes
            );
        }

        List<ScanEvent> scans = scanEventRepository.findByUserIdOrderByScannedAtDesc(userId);

        long totalScans = scans.size();
        long totalCodes = codes.size();
        long todayScans = scans.stream().filter(scan -> scan.getScannedAt().isAfter(Instant.now().minusSeconds(86_400))).count();
        long weekScans = scans.stream().filter(scan -> scan.getScannedAt().isAfter(Instant.now().minusSeconds(604_800))).count();
        long uniqueCountries = scans.stream().map(ScanEvent::getCountry).filter(country -> country != null && !country.isBlank()).distinct().count();
        long mobileScans = scans.stream().filter(scan -> "mobile".equalsIgnoreCase(scan.getDeviceType())).count();
        long desktopScans = scans.stream().filter(scan -> "desktop".equalsIgnoreCase(scan.getDeviceType())).count();

        List<TopPerformingQrResponse> topCodes = codes.stream()
            .sorted(Comparator.comparingLong(QrCodeEntity::getTotalScans).reversed())
            .limit(5)
            .map(code -> new TopPerformingQrResponse(code.getId(), code.getName(), code.getTotalScans()))
            .toList();

        return new AnalyticsOverviewResponse(
            totalCodes,
            totalScans,
            todayScans,
            weekScans,
            uniqueCountries,
            mobileScans,
            desktopScans,
            buildChartData(scans),
            buildDeviceData(totalScans, mobileScans, desktopScans),
            topCodes
        );
    }

    public QrAnalyticsResponse getQrAnalytics(UUID userId, UUID qrCodeId) {
        QrCodeEntity code = qrCodeService.getEntityForUser(userId, qrCodeId);
        if (code == null) {
            throw new ResourceNotFoundException("QR code not found");
        }

        ClickHouseAnalyticsStore clickHouseAnalyticsStore = clickHouseAnalyticsStoreProvider.getIfAvailable();
        if (clickHouseAnalyticsStore != null) {
            long totalScans = clickHouseAnalyticsStore.countByQrCodeId(qrCodeId);
            long uniqueCountries = clickHouseAnalyticsStore.countUniqueCountriesByQrCodeId(qrCodeId);
            long mobileScans = clickHouseAnalyticsStore.countByQrCodeIdAndDeviceType(qrCodeId, "mobile");
            long desktopScans = clickHouseAnalyticsStore.countByQrCodeIdAndDeviceType(qrCodeId, "desktop");

            return new QrAnalyticsResponse(
                totalScans,
                uniqueCountries,
                mobileScans,
                desktopScans,
                clickHouseAnalyticsStore.chartDataByQrCodeId(qrCodeId),
                buildDeviceData(totalScans, mobileScans, desktopScans),
                clickHouseAnalyticsStore.recentScansByQrCodeId(qrCodeId, 10)
            );
        }

        List<ScanEvent> scans = scanEventRepository.findByQrCodeIdOrderByScannedAtDesc(qrCodeId);
        long totalScans = scans.size();
        long uniqueCountries = scans.stream().map(ScanEvent::getCountry).filter(country -> country != null && !country.isBlank()).distinct().count();
        long mobileScans = scans.stream().filter(scan -> "mobile".equalsIgnoreCase(scan.getDeviceType())).count();
        long desktopScans = scans.stream().filter(scan -> "desktop".equalsIgnoreCase(scan.getDeviceType())).count();

        List<RecentScanResponse> recentScans = scans.stream()
            .limit(10)
            .map(scan -> new RecentScanResponse(
                scan.getId(),
                scan.getScannedAt(),
                scan.getCountry(),
                scan.getCity(),
                scan.getDeviceType(),
                scan.getBrowser(),
                scan.getOs()
            ))
            .toList();

        return new QrAnalyticsResponse(
            totalScans,
            uniqueCountries,
            mobileScans,
            desktopScans,
            buildChartData(scans),
            buildDeviceData(totalScans, mobileScans, desktopScans),
            recentScans
        );
    }

    public String resolveAndTrack(String shortCode, String signature, HttpServletRequest request) {
        QrCodeEntity qrCode = qrCodeService.getActiveByShortCode(shortCode);
        redirectUrlSigner.validate(shortCode, signature);

        String userAgent = request.getHeader("User-Agent");
        if (shouldTrackRequest(request, userAgent)) {
            scanEventPublisher.publish(new ScanTrackingRequestedEvent(
                UUID.randomUUID(),
                qrCode.getId(),
                qrCode.getUser().getId(),
                Instant.now(),
                anonymizeIp(clientIp(request)),
                userAgent,
                request.getHeader("Referer"),
                firstHeader(request, "X-Vercel-IP-Country", "CF-IPCountry", "X-Country"),
                firstHeader(request, "X-Vercel-IP-City", "X-City"),
                detectDeviceType(userAgent),
                detectBrowser(userAgent),
                detectOs(userAgent)
            ));
        }

        return resolveDestination(qrCode);
    }

    private List<DailyScanPoint> buildChartData(List<ScanEvent> scans) {
        Map<LocalDate, Long> grouped = new TreeMap<>();
        ZoneId zoneId = ZoneId.systemDefault();
        scans.forEach(scan -> {
            LocalDate date = scan.getScannedAt().atZone(zoneId).toLocalDate();
            grouped.put(date, grouped.getOrDefault(date, 0L) + 1);
        });

        return grouped.entrySet().stream()
            .map(entry -> new DailyScanPoint(entry.getKey().toString(), entry.getValue()))
            .toList();
    }

    private List<DeviceBreakdownItem> buildDeviceData(long totalScans, long mobileScans, long desktopScans) {
        long otherScans = Math.max(totalScans - mobileScans - desktopScans, 0);
        return List.of(
                new DeviceBreakdownItem("Mobile", mobileScans, "var(--chart-1)"),
                new DeviceBreakdownItem("Desktop", desktopScans, "var(--chart-2)"),
                new DeviceBreakdownItem("Other", otherScans, "var(--chart-3)")
            ).stream()
            .filter(item -> item.value() > 0)
            .toList();
    }

    private String resolveDestination(QrCodeEntity qrCode) {
        return qrCode.getDestinationUrl() != null && !qrCode.getDestinationUrl().isBlank()
            ? qrCode.getDestinationUrl()
            : qrCode.getContent();
    }

    private boolean shouldTrackRequest(HttpServletRequest request, String userAgent) {
        String method = firstHeader(request, "X-Original-Method");
        String normalizedMethod = (method == null || method.isBlank() ? request.getMethod() : method)
            .toUpperCase(Locale.ROOT);

        if (!"GET".equals(normalizedMethod)) {
            return false;
        }

        if (isPrefetchRequest(request)) {
            return false;
        }

        return !isBotUserAgent(userAgent);
    }

    private boolean isPrefetchRequest(HttpServletRequest request) {
        String purpose = firstHeader(request, "Purpose", "Sec-Purpose", "X-Purpose");
        if (purpose != null && purpose.toLowerCase(Locale.ROOT).contains("prefetch")) {
            return true;
        }

        String mozHeader = firstHeader(request, "X-Moz");
        if (mozHeader != null && "prefetch".equalsIgnoreCase(mozHeader)) {
            return true;
        }

        return firstHeader(request, "Next-Router-Prefetch", "X-Nextjs-Prefetch") != null;
    }

    private boolean isBotUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return false;
        }

        String normalized = userAgent.toLowerCase(Locale.ROOT);
        return KNOWN_BOT_MARKERS.stream().anyMatch(normalized::contains);
    }

    private String clientIp(HttpServletRequest request) {
        String header = request.getHeader("X-Forwarded-For");
        if (header != null && !header.isBlank()) {
            return header.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String anonymizeIp(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(ipAddress.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder("sha256:");
            for (int index = 0; index < 12 && index < bytes.length; index++) {
                builder.append(String.format("%02x", bytes[index]));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            return "sha256:unavailable";
        }
    }

    private String firstHeader(HttpServletRequest request, String... names) {
        for (String name : names) {
            String value = request.getHeader(name);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String detectDeviceType(String userAgent) {
        if (userAgent == null) {
            return "desktop";
        }
        String value = userAgent.toLowerCase();
        if (value.contains("ipad") || value.contains("tablet")) {
            return "tablet";
        }
        if (value.contains("mobile") || value.contains("android") || value.contains("iphone")) {
            return "mobile";
        }
        return "desktop";
    }

    private String detectBrowser(String userAgent) {
        if (userAgent == null) {
            return "Unknown";
        }
        if (userAgent.contains("Edg")) return "Edge";
        if (userAgent.contains("Chrome")) return "Chrome";
        if (userAgent.contains("Firefox")) return "Firefox";
        if (userAgent.contains("Safari")) return "Safari";
        return "Unknown";
    }

    private String detectOs(String userAgent) {
        if (userAgent == null) {
            return "Unknown";
        }
        if (userAgent.contains("Windows")) return "Windows";
        if (userAgent.contains("Mac")) return "macOS";
        if (userAgent.contains("Android")) return "Android";
        if (userAgent.contains("iPhone") || userAgent.contains("iPad")) return "iOS";
        if (userAgent.contains("Linux")) return "Linux";
        return "Unknown";
    }
}
