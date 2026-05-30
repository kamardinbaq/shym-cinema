package com.cinema.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private String name;
    private Integer stars;
    private String body;
    private LocalDateTime createdAt;
}
