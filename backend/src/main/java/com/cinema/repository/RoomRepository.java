package com.cinema.repository;

import com.cinema.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findAllByActiveTrue();

    @Query("SELECT r FROM Room r LEFT JOIN FETCH r.timeSlots ts WHERE r.active = true AND ts.active = true")
    List<Room> findAllActiveWithSlots();
}
