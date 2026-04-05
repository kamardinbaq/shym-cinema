package com.cinema.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class PaymentRequest {

    @NotNull(message = "Reservation ID is required")
    private Long reservationId;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?7[0-9]{10}$", message = "Invalid Kazakh phone number format (+7XXXXXXXXXX)")
    private String phoneNumber;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // KASPI_QR, KASPI_PAY
}
