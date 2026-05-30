package com.cinema.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity
@Table(name = "time_slots",
       uniqueConstraints = @UniqueConstraint(columnNames = {"room_id","start_time"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TimeSlot {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "room_id", nullable = false)
    private Room room;
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    @Column(nullable = false) @Builder.Default
    private boolean active = true;
}
