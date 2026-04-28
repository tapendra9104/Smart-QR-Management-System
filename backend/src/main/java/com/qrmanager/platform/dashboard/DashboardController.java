package com.qrmanager.platform.dashboard;

import com.qrmanager.platform.dashboard.dto.DashboardSummaryResponse;
import com.qrmanager.platform.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final CurrentUserService currentUserService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> summary() {
        return ResponseEntity.ok(dashboardService.getSummary(currentUserService.require().id()));
    }
}
