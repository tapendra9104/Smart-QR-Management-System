package com.qrmanager.platform.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseUrlEnvironmentPostProcessorTests {

    @Test
    void normalizesProviderPostgresUrlToJdbcUrl() {
        var normalized = DatabaseUrlEnvironmentPostProcessor.normalize(
            "postgresql://neondb_owner:s3cr%40t@ep-test.us-east-2.aws.neon.tech/neondb?sslmode=require"
        );

        assertThat(normalized).isNotNull();
        assertThat(normalized.jdbcUrl())
            .isEqualTo("jdbc:postgresql://ep-test.us-east-2.aws.neon.tech/neondb?sslmode=require");
        assertThat(normalized.username()).isEqualTo("neondb_owner");
        assertThat(normalized.password()).isEqualTo("s3cr@t");
    }

    @Test
    void addsSslModeForNeonUrlsWhenMissing() {
        var normalized = DatabaseUrlEnvironmentPostProcessor.normalize(
            "postgres://owner:secret@ep-test.us-east-2.aws.neon.tech/neondb"
        );

        assertThat(normalized).isNotNull();
        assertThat(normalized.jdbcUrl())
            .isEqualTo("jdbc:postgresql://ep-test.us-east-2.aws.neon.tech/neondb?sslmode=require");
    }

    @Test
    void exposesDatabaseUrlAsSpringDatasourceProperties() {
        MockEnvironment environment = new MockEnvironment()
            .withProperty("DATABASE_URL", "postgresql://owner:secret@db.example.com/app");

        new DatabaseUrlEnvironmentPostProcessor().postProcessEnvironment(environment, null);

        assertThat(environment.getProperty("spring.datasource.url"))
            .isEqualTo("jdbc:postgresql://db.example.com/app");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("owner");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("secret");
    }
}
