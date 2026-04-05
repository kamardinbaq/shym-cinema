package com.cinema.repository;

import com.cinema.entity.Reservation;
import com.cinema.entity.ReservationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // Pessimistic lock to prevent double booking
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Reservation r WHERE r.room.id = :roomId " +
           "AND r.timeSlot.id = :slotId AND r.reservationDate = :date " +
           "AND r.status NOT IN ('CANCELLED', 'EXPIRED')")
    Optional<Reservation> findActiveByRoomSlotDate(
        @Param("roomId") Long roomId,
        @Param("slotId") Long slotId,
        @Param("date") LocalDate date
    );

    List<Reservation> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT r FROM Reservation r " +
           "JOIN FETCH r.room JOIN FETCH r.timeSlot JOIN FETCH r.user " +
           "WHERE r.reservationDate = :date ORDER BY r.timeSlot.startTime")
    List<Reservation> findAllByDateWithDetails(@Param("date") LocalDate date);

    @Query("SELECT r FROM Reservation r " +
           "JOIN FETCH r.room JOIN FETCH r.timeSlot JOIN FETCH r.user " +
           "WHERE r.room.id = :roomId AND r.reservationDate = :date")
    List<Reservation> findByRoomAndDate(
        @Param("roomId") Long roomId,
        @Param("date") LocalDate date
    );

    @Query("SELECT r FROM Reservation r " +
           "JOIN FETCH r.room JOIN FETCH r.timeSlot JOIN FETCH r.user " +
           "ORDER BY r.createdAt DESC")
    List<Reservation> findAllWithDetails();

    @Query("SELECT r FROM Reservation r " +
           "JOIN FETCH r.room JOIN FETCH r.timeSlot " +
           "WHERE r.room.id = :roomId AND r.timeSlot.id = :slotId " +
           "AND r.reservationDate = :date AND r.status IN ('PENDING','CONFIRMED')")
    Optional<Reservation> findBookedSlot(
        @Param("roomId") Long roomId,
        @Param("slotId") Long slotId,
        @Param("date") LocalDate date
    );

    // Availability check for grid (single date)
    @Query("SELECT r FROM Reservation r " +
           "WHERE r.reservationDate = :date AND r.status IN ('PENDING','CONFIRMED')")
    List<Reservation> findAllActiveByDate(@Param("date") LocalDate date);

    // Availability check for business day spanning two calendar dates
    @Query("SELECT r FROM Reservation r " +
           "WHERE r.reservationDate IN :dates AND r.status IN ('PENDING','CONFIRMED')")
    List<Reservation> findAllActiveByDates(@Param("dates") List<LocalDate> dates);

    // Find stale PENDING reservations for expiry job
    @Query("SELECT r FROM Reservation r WHERE r.status = 'PENDING' AND r.createdAt < :expiryTime")
    List<Reservation> findExpiredPendingReservations(@Param("expiryTime") java.time.LocalDateTime expiryTime);
}
