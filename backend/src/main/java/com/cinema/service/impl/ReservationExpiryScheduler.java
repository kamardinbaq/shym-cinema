package com.cinema.service.impl;

import com.cinema.entity.Reservation;
import com.cinema.entity.ReservationStatus;
import com.cinema.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationExpiryScheduler {

    private static final int PENDING_EXPIRY_MINUTES = 10;
    private static final ZoneId ALMATY_ZONE = ZoneId.of("Asia/Almaty");

    private final ReservationRepository reservationRepository;

    @Scheduled(fixedRate = 60_000) // runs every 60 seconds
    @Transactional
    public void expireStaleReservations() {
        LocalDateTime expiryTime = LocalDateTime.now(ALMATY_ZONE).minusMinutes(PENDING_EXPIRY_MINUTES);

        List<Reservation> stale = reservationRepository.findExpiredPendingReservations(expiryTime);

        if (stale.isEmpty()) return;

        stale.forEach(r -> r.setStatus(ReservationStatus.EXPIRED));
        reservationRepository.saveAll(stale);

        log.info("Expired {} stale PENDING reservation(s) older than {} minutes",
                stale.size(), PENDING_EXPIRY_MINUTES);
    }
}
