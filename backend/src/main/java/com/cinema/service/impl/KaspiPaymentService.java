package com.cinema.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Mock Kaspi Pay integration.
 * Replace with real Kaspi Pay SDK / REST calls in production.
 */
@Service
@Slf4j
public class KaspiPaymentService {

    @Value("${app.kaspi.mock-enabled:true}")
    private boolean mockEnabled;

    @Value("${app.kaspi.success-rate:0.95}")
    private double successRate;

    public record KaspiPayResult(
            boolean success,
            String transactionId,
            String kaspiOrderId,
            String message
    ) {}

    /**
     * Initiates a Kaspi payment request.
     *
     * @param phoneNumber customer phone in +7XXXXXXXXXX format
     * @param amount      payment amount in KZT
     * @param description order description shown to customer
     */
    public KaspiPayResult initiatePayment(String phoneNumber, BigDecimal amount, String description) {
        if (mockEnabled) {
            return mockPayment(phoneNumber, amount, description);
        }
        // TODO: integrate real Kaspi Pay REST API here
        throw new UnsupportedOperationException("Real Kaspi integration not yet configured");
    }

    private KaspiPayResult mockPayment(String phoneNumber, BigDecimal amount, String description) {
        log.info("[KASPI MOCK] Initiating payment: phone={}, amount={} KZT, description={}",
                phoneNumber, amount, description);

        // Simulate network latency
        try { Thread.sleep(300); } catch (InterruptedException ignored) {}

        boolean success = Math.random() < successRate;
        String txId = "TXN_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        String orderId = "KSP_" + System.currentTimeMillis();

        if (success) {
            log.info("[KASPI MOCK] Payment SUCCESS: txId={}, orderId={}", txId, orderId);
            return new KaspiPayResult(true, txId, orderId, "Payment successful");
        } else {
            log.warn("[KASPI MOCK] Payment FAILED for phone={}", phoneNumber);
            return new KaspiPayResult(false, null, null, "Payment declined by Kaspi. Please try again.");
        }
    }

    /**
     * Calculates the price per session based on room capacity and people count.
     * Adjust pricing logic to match your actual pricing model.
     */
    public BigDecimal calculateAmount(int peopleCount, String themeCode) {
        // Base prices per person in KZT
        BigDecimal pricePerPerson = switch (themeCode) {
            case "DEAD"      -> new BigDecimal("4500");
            case "LIVING"    -> new BigDecimal("5000");
            case "PASSENGER" -> new BigDecimal("4000");
            default          -> new BigDecimal("4500");
        };
        return pricePerPerson.multiply(BigDecimal.valueOf(peopleCount));
    }
}
