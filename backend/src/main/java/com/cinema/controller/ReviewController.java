package com.cinema.controller;

import com.cinema.dto.request.ReviewRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.ReviewResponse;
import com.cinema.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/api/reviews")
    public ApiResponse<List<ReviewResponse>> getAll() {
        return ApiResponse.ok(reviewService.getAll());
    }

    @PostMapping("/api/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReviewResponse> create(@Valid @RequestBody ReviewRequest req) {
        return ApiResponse.ok(reviewService.create(req));
    }

    @DeleteMapping("/api/admin/reviews/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ROOT')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        reviewService.delete(id);
        return ApiResponse.ok("Deleted", null);
    }
}
