package com.qrmanager.platform.analytics;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.analytics.olap-enabled", havingValue = "true")
public class ClickHouseSchemaInitializer implements ApplicationRunner {

    private final JdbcTemplate clickHouseJdbcTemplate;

    public ClickHouseSchemaInitializer(@org.springframework.beans.factory.annotation.Qualifier("clickHouseJdbcTemplate") JdbcTemplate clickHouseJdbcTemplate) {
        this.clickHouseJdbcTemplate = clickHouseJdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        clickHouseJdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS qr_scan_events_olap (
                event_id String,
                qr_code_id String,
                user_id String,
                scanned_at DateTime64(3, 'UTC'),
                country String,
                city String,
                device_type LowCardinality(String),
                browser LowCardinality(String),
                os LowCardinality(String),
                referer String
            )
            ENGINE = MergeTree
            ORDER BY (user_id, qr_code_id, scanned_at, event_id)
            """);
    }
}
