package com.cinema.repository;
import com.cinema.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findAllByVenueOrderByCreatedAtDesc(String venue);
}
