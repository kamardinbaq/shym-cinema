package com.cinema.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AdminReservationRequest {

    @NotNull
    private Long userId;

    @NotNull
    private Long roomId;

    @NotNull
    private Long timeSlotId;

    @NotNull
    @FutureOrPresent
    private LocalDate reservationDate;

    @NotNull
    @Min(1)
    private Integer peopleCount;

    private String notes;

    // Admin can bypass payment — mark as directly confirmed
    private boolean skipPayment = false;
}
