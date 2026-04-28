package com.qrmanager.platform;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.SpringApplication;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class QrManagerPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(QrManagerPlatformApplication.class, args);
    }
}
