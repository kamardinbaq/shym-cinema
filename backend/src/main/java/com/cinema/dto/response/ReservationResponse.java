package com.cinema.dto.response;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReservationResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userPhone;
    private Long roomId;
    private String roomName;
    private Long timeSlotId;
    private String startTime;
    private String endTime;
    private String reservationDate;
    private int peopleCount;
    private String status;
    private String notes;
    private String confirmationCode;
    private PaymentResponse payment;
    private LocalDateTime createdAt;
}
