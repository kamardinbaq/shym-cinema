package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.AvailabilityGridResponse;
import com.cinema.dto.response.RoomResponse;
import com.cinema.service.impl.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/rooms")
    public ApiResponse<List<RoomResponse>> getAllRooms() {
        return ApiResponse.ok(roomService.getAllRooms());
    }

    @GetMapping("/rooms/{id}")
    public ApiResponse<RoomResponse> getRoomById(@PathVariable Long id) {
        return ApiResponse.ok(roomService.getRoomById(id));
    }

    @GetMapping("/availability")
    public ApiResponse<AvailabilityGridResponse> getAvailabilityGrid(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        return ApiResponse.ok(roomService.getAvailabilityGrid(targetDate));
    }
}
