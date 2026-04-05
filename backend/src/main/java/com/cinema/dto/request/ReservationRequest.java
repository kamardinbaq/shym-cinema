package com.cinema.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ReservationRequest {

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Time slot ID is required")
    private Long timeSlotId;

    @NotNull(message = "Reservation date is required")
    @FutureOrPresent(message = "Date must be today or in the future")
    private LocalDate reservationDate;

    @NotNull(message = "People count is required")
    @Min(value = 1, message = "At least 1 person required")
    @Max(value = 20, message = "Exceeded maximum group size")
    private Integer peopleCount;

    @Size(max = 500)
    private String notes;
}
