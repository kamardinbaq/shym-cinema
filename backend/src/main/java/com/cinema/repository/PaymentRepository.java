package com.cinema.repository;

import com.cinema.entity.Payment;
import com.cinema.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByReservationId(Long reservationId);
    Optional<Payment> findByKaspiOrderId(String kaspiOrderId);
    Optional<Payment> findByTransactionId(String transactionId);
}
