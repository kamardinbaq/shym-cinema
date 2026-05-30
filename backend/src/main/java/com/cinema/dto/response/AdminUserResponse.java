package com.cinema.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String username;
    private boolean root;
    private LocalDateTime createdAt;
}
