package com.cinema.controller;

import com.cinema.dto.request.ReservationRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.ReservationResponse;
import com.cinema.service.impl.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public ApiResponse<List<ReservationResponse>> getMyReservations(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.ok(reservationService.getUserReservations(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ApiResponse<ReservationResponse> getReservationById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.ok(reservationService.getReservationById(id, userDetails.getUsername()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReservationResponse> createReservation(
            @Valid @RequestBody ReservationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.ok("Reservation created. Please proceed to payment.",
                reservationService.createReservation(request, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> cancelReservation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        reservationService.cancelReservation(id, userDetails.getUsername());
        return ApiResponse.ok("Reservation cancelled successfully", null);
    }
}
