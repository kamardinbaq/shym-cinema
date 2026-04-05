package com.cinema.controller;

import com.cinema.dto.request.AdminReservationRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.ReservationResponse;
import com.cinema.service.impl.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/reservations")
    public ApiResponse<List<ReservationResponse>> getAllReservations(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long roomId) {

        if (date != null && roomId != null) {
            return ApiResponse.ok(adminService.getReservationsByRoomAndDate(roomId, date));
        } else if (date != null) {
            return ApiResponse.ok(adminService.getReservationsByDate(date));
        }
        return ApiResponse.ok(adminService.getAllReservations());
    }

    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReservationResponse> createReservation(
            @Valid @RequestBody AdminReservationRequest request) {
        return ApiResponse.ok("Reservation created by admin",
                adminService.createReservation(request));
    }

    @DeleteMapping("/reservations/{id}")
    public ApiResponse<Void> cancelReservation(@PathVariable Long id) {
        adminService.cancelReservation(id);
        return ApiResponse.ok("Reservation cancelled", null);
    }
}
