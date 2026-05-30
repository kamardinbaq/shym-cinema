package com.cinema.repository;
import com.cinema.entity.SlotReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
public interface SlotReservationRepository extends JpaRepository<SlotReservation, Long> {
    @Query("SELECT sr FROM SlotReservation sr WHERE sr.timeSlot.id = :slotId AND sr.reservationDate = :date")
    Optional<SlotReservation> findBySlotAndDate(@Param("slotId") Long slotId, @Param("date") LocalDate date);

    @Query("SELECT sr FROM SlotReservation sr WHERE sr.reservationDate IN :dates")
    List<SlotReservation> findAllByDates(@Param("dates") List<LocalDate> dates);
}
