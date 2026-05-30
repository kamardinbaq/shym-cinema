package com.cinema.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "slot_reservations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"time_slot_id","reservation_date"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SlotReservation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "room_id", nullable = false)
    private Room room;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "time_slot_id", nullable = false)
    private TimeSlot timeSlot;
    @Column(name = "reservation_date", nullable = false)
    private LocalDate reservationDate;
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
}
