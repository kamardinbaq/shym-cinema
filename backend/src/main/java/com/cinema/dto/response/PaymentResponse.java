package com.cinema.dto.response;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private Long reservationId;
    private BigDecimal amount;
    private String currency;
    private String provider;
    private String status;
    private String transactionId;
    private String kaspiOrderId;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
