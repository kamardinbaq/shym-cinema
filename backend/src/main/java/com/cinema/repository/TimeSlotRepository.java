package com.cinema.repository;

import com.cinema.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    List<TimeSlot> findAllByRoomIdAndActiveTrue(Long roomId);

    List<TimeSlot> findAllByActiveTrue();
}
