package com.cinema.dto.request;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data public class ReviewRequest {
    @Size(max=100) private String name;
    @NotNull @Min(1) @Max(5) private Integer stars;
    @NotBlank @Size(max=1000) private String body;
}
