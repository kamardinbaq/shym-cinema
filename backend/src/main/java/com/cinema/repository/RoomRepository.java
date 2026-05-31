package com.cinema.repository;
import com.cinema.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface RoomRepository extends JpaRepository<Room, Long> {
    @Query("SELECT r FROM Room r LEFT JOIN FETCH r.timeSlots ts WHERE r.active = true AND r.type = :type AND ts.active = true")
    List<Room> findAllActiveByTypeWithSlots(@Param("type") String type);
}
