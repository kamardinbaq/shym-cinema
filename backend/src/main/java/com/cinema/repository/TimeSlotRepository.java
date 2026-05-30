package com.cinema.repository;
import com.cinema.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {}
