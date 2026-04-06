package com.cinema.service.impl;

import com.cinema.dto.request.PaymentRequest;
import com.cinema.dto.response.PaymentResponse;
import com.cinema.entity.*;
import com.cinema.exception.*;
import com.cinema.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;
    private final KaspiPaymentService kaspiPaymentService;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request, String username) {
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", request.getReservationId()));

        // Ensure the reservation belongs to the requesting user
        if (!reservation.getUser().getUsername().equals(username)) {
            throw new UnauthorizedException("You can only pay for your own reservations");
        }

        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            throw new BusinessException("Reservation is already paid and confirmed");
        }
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Cannot pay for a cancelled reservation");
        }

        // Check for existing payment
        paymentRepository.findByReservationId(reservation.getId()).ifPresent(p -> {
            if (p.getStatus() == PaymentStatus.SUCCESS) {
                throw new BusinessException("Payment already completed for this reservation");
            }
        });

        // Calculate amount
        java.math.BigDecimal amount = kaspiPaymentService.calculateAmount(
                reservation.getPeopleCount(),
                reservation.getRoom().getThemeCode()
        );

        String description = String.format("Horror Cinema – %s, %s at %s for %d people",
                reservation.getRoom().getName(),
                reservation.getReservationDate(),
                reservation.getTimeSlot().getStartTime(),
                reservation.getPeopleCount());

        // Call Kaspi
        KaspiPaymentService.KaspiPayResult result =
                kaspiPaymentService.initiatePayment(request.getPhoneNumber(), amount, description);

        // Upsert payment record
        Payment payment = paymentRepository.findByReservationId(reservation.getId())
                .orElse(Payment.builder()
                        .reservation(reservation)
                        .amount(amount)
                        .currency("KZT")
                        .provider("KASPI")
                        .paymentMethod(request.getPaymentMethod())
                        .build());

        if (result.success()) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTransactionId(result.transactionId());
            payment.setKaspiOrderId(result.kaspiOrderId());
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Reservation stays PENDING — admin must confirm after verifying the Kaspi check
            log.info("Payment recorded: reservationId={}, txId={} — awaiting admin confirmation",
                    reservation.getId(), result.transactionId());
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            log.warn("Payment FAILED: reservationId={}", reservation.getId());
            throw new PaymentException(result.message());
        }

        return PaymentResponse.builder()
                .id(payment.getId())
                .reservationId(reservation.getId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .provider(payment.getProvider())
                .status(payment.getStatus().name())
                .transactionId(payment.getTransactionId())
                .kaspiOrderId(payment.getKaspiOrderId())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
