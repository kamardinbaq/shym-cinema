package com.cinema.entity;

public enum ReservationStatus {
    PENDING,      // awaiting payment
    CONFIRMED,    // payment successful
    CANCELLED,    // cancelled by user or admin
    EXPIRED       // payment window elapsed
}
