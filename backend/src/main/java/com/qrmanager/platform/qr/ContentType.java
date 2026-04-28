package com.qrmanager.platform.qr;

public enum ContentType {
    URL,
    TEXT,
    VCARD,
    WIFI,
    EMAIL,
    SMS,
    PHONE,
    WHATSAPP;

    public static ContentType fromValue(String value) {
        return ContentType.valueOf(value.trim().toUpperCase());
    }

    public String toApiValue() {
        return name().toLowerCase();
    }
}
