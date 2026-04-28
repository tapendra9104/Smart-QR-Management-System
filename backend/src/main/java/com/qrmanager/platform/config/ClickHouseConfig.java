package com.qrmanager.platform.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;

@Configuration
@ConditionalOnProperty(name = "app.analytics.olap-enabled", havingValue = "true")
public class ClickHouseConfig {

    @Bean(name = "clickHouseDataSource")
    public DataSource clickHouseDataSource(AppProperties appProperties) {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("com.clickhouse.jdbc.ClickHouseDriver");
        dataSource.setUrl(appProperties.clickHouseJdbcUrl());
        dataSource.setUsername(appProperties.clickHouseUsername());
        dataSource.setPassword(appProperties.clickHousePassword());
        return dataSource;
    }

    @Bean(name = "clickHouseJdbcTemplate")
    public JdbcTemplate clickHouseJdbcTemplate(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        return new JdbcTemplate(clickHouseDataSource);
    }
}
