package com.cinema.controller;

import com.cinema.dto.request.PaymentRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.PaymentResponse;
import com.cinema.service.impl.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/kaspi")
    public ApiResponse<PaymentResponse> processKaspiPayment(
            @Valid @RequestBody PaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        PaymentResponse response = paymentService.processPayment(request, userDetails.getUsername());
        return ApiResponse.ok("Payment processed successfully", response);
    }
}
