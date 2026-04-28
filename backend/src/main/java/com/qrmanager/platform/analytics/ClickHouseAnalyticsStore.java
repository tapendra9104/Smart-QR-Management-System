package com.qrmanager.platform.analytics;

import com.qrmanager.platform.analytics.dto.DailyScanPoint;
import com.qrmanager.platform.analytics.dto.RecentScanResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.analytics.olap-enabled", havingValue = "true")
public class ClickHouseAnalyticsStore {

    private final JdbcTemplate clickHouseJdbcTemplate;

    public ClickHouseAnalyticsStore(@org.springframework.beans.factory.annotation.Qualifier("clickHouseJdbcTemplate") JdbcTemplate clickHouseJdbcTemplate) {
        this.clickHouseJdbcTemplate = clickHouseJdbcTemplate;
    }

    public void insertScanEvent(ScanTrackingRequestedEvent event) {
        clickHouseJdbcTemplate.update("""
            INSERT INTO qr_scan_events_olap (
                event_id,
                qr_code_id,
                user_id,
                scanned_at,
                country,
                city,
                device_type,
                browser,
                os,
                referer
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            event.eventId().toString(),
            event.qrCodeId().toString(),
            event.userId().toString(),
            Timestamp.from(event.scannedAt()),
            valueOrEmpty(event.country()),
            valueOrEmpty(event.city()),
            valueOrEmpty(event.deviceType()),
            valueOrEmpty(event.browser()),
            valueOrEmpty(event.os()),
            valueOrEmpty(event.referer())
        );
    }

    public long countByUserId(UUID userId) {
        return valueOrZero(clickHouseJdbcTemplate.queryForObject(
            "SELECT countDistinct(event_id) FROM qr_scan_events_olap WHERE user_id = ?",
            Long.class,
            userId.toString()
        ));
    }

    public long countRecentByUserId(UUID userId, Instant since) {
        return valueOrZero(clickHouseJdbcTemplate.queryForObject(
            "SELECT countDistinct(event_id) FROM qr_scan_events_olap WHERE user_id = ? AND scanned_at >= ?",
            Long.class,
            userId.toString(),
            Timestamp.from(since)
        ));
    }

    public long countUniqueCountriesByUserId(UUID userId) {
        return valueOrZero(clickHouseJdbcTemplate.queryForObject(
            "SELECT countDistinct(country) FROM qr_scan_events_olap WHERE user_id = ? AND country != ''",
            Long.class,
            userId.toString()
        ));
    }

    public long countByUserIdAndDeviceType(UUID userId, String deviceType) {
        return valueOrZero(clickHouseJdbcTemplate.queryForObject(
            "SELECT countDistinct(event_id) FROM qr_scan_events_olap WHERE user_id = ? AND lower(device_type) = lower(?)",
            Long.class,
            userId.toString(),
            deviceType
        ));
    }

    public List<DailyScanPoint> chartDataByUserId(UUID userId) {
        return clickHouseJdbcTemplate.query("""
                SELECT formatDateTime(toDate(scanned_at), '%Y-%m-%d') AS scan_date,
                       countDistinct(event_id) AS scan_count
                FROM qr_scan_events_olap
                WHERE user_id = ?
                GROUP BY scan_date
                ORDER BY scan_date
                """,
            (rs, rowNum) -> new DailyScanPoint(rs.getString("scan_date"), rs.getLong("scan_count")),
            userId.toString()
        );
    }

    public long countByQrCodeId(UUID qrCodeId) {
        return valueOrZero(clickHouseJdbcTemplate.queryForObject(
            "SELECT countDistinct(event_id) FROM qr_scan_events_olap WHERE qr_code_id = ?",
            Long.class,
            qrCodeId.toString()
        ));
    }

    public long countUniqueCountriesByQrCodeId(UUID qrCodeId) {
        return valueOrZero(clickHouseJdbcTemplate.queryForObject(
            "SELECT countDistinct(country) FROM qr_scan_events_olap WHERE qr_code_id = ? AND country != ''",
            Long.class,
            qrCodeId.toString()
        ));
    }

    public long countByQrCodeIdAndDeviceType(UUID qrCodeId, String deviceType) {
        return valueOrZero(clickHouseJdbcTemplate.queryForObject(
            "SELECT countDistinct(event_id) FROM qr_scan_events_olap WHERE qr_code_id = ? AND lower(device_type) = lower(?)",
            Long.class,
            qrCodeId.toString(),
            deviceType
        ));
    }

    public List<DailyScanPoint> chartDataByQrCodeId(UUID qrCodeId) {
        return clickHouseJdbcTemplate.query("""
                SELECT formatDateTime(toDate(scanned_at), '%Y-%m-%d') AS scan_date,
                       countDistinct(event_id) AS scan_count
                FROM qr_scan_events_olap
                WHERE qr_code_id = ?
                GROUP BY scan_date
                ORDER BY scan_date
                """,
            (rs, rowNum) -> new DailyScanPoint(rs.getString("scan_date"), rs.getLong("scan_count")),
            qrCodeId.toString()
        );
    }

    public List<RecentScanResponse> recentScansByQrCodeId(UUID qrCodeId, int limit) {
        return clickHouseJdbcTemplate.query("""
                SELECT event_id,
                       max(scanned_at) AS scanned_at,
                       any(country) AS country,
                       any(city) AS city,
                       any(device_type) AS device_type,
                       any(browser) AS browser,
                       any(os) AS os
                FROM qr_scan_events_olap
                WHERE qr_code_id = ?
                GROUP BY event_id
                ORDER BY scanned_at DESC
                LIMIT ?
                """,
            (rs, rowNum) -> new RecentScanResponse(
                UUID.fromString(rs.getString("event_id")),
                rs.getTimestamp("scanned_at").toInstant(),
                emptyToNull(rs.getString("country")),
                emptyToNull(rs.getString("city")),
                emptyToNull(rs.getString("device_type")),
                emptyToNull(rs.getString("browser")),
                emptyToNull(rs.getString("os"))
            ),
            qrCodeId.toString(),
            limit
        );
    }

    private long valueOrZero(Long value) {
        return value == null ? 0L : value;
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
