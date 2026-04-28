package com.qrmanager.platform.messaging;

public final class MessagingTopology {

    public static final String EVENTS_EXCHANGE = "seq-lams.events";
    public static final String DEAD_LETTER_EXCHANGE = "seq-lams.events.dlx";

    public static final String SCAN_TRACKING_QUEUE = "seq-lams.scan-tracking";
    public static final String SCAN_TRACKING_ROUTING_KEY = "analytics.scan";
    public static final String SCAN_TRACKING_DLQ = "seq-lams.scan-tracking.dlq";

    public static final String AUDIT_LOG_QUEUE = "seq-lams.audit-log";
    public static final String AUDIT_LOG_ROUTING_KEY = "audit.log";
    public static final String AUDIT_LOG_DLQ = "seq-lams.audit-log.dlq";

    private MessagingTopology() {
    }
}
