package com.cinema.dto.response;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TimeSlotResponse {
    private Long id;
    private Long roomId;
    private String startTime;
    private String endTime;
    private boolean active;
}
