package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.AvailabilityGridResponse;
import com.cinema.service.AvailabilityService;
import com.cinema.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;
    private final AdminService        adminService;

    @GetMapping("/availability")
    public ApiResponse<AvailabilityGridResponse> getGrid(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.ok(availabilityService.getGrid(date != null ? date : LocalDate.now()));
    }

    /** Public endpoint — frontend reads whatsapp_number and youtube_url */
    @GetMapping("/settings")
    public ApiResponse<Map<String, String>> getPublicSettings() {
        return ApiResponse.ok(adminService.getSettings());
    }
}
