package com.qrmanager.platform.qr.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public record QrCodeStyleDto(
    String fgColor,
    String bgColor,
    Integer size,
    Integer quietZone,
    String ecLevel,
    String qrStyle,
    Integer eyeRadius,
    String logoImage,
    Integer logoWidth,
    Integer logoHeight,
    Double logoOpacity,
    Boolean removeQrCodeBehindLogo
) {
}
