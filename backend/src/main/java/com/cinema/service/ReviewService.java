package com.cinema.service;

import com.cinema.dto.request.ReviewRequest;
import com.cinema.dto.response.ReviewResponse;
import com.cinema.entity.Review;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAll() {
        return reviewRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ReviewResponse create(ReviewRequest req) {
        Review review = Review.builder()
                .name(req.getName())
                .stars(req.getStars())
                .body(req.getBody())
                .build();
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public void delete(Long id) {
        if (!reviewRepository.existsById(id))
            throw new ResourceNotFoundException("Review", id);
        reviewRepository.deleteById(id);
    }

    private ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId()).name(r.getName()).stars(r.getStars())
                .body(r.getBody()).createdAt(r.getCreatedAt()).build();
    }
}
