// RoomResponse.java
package com.cinema.dto.response;
import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RoomResponse {
    private Long id;
    private String name;
    private String description;
    private int capacity;
    private int minPeople;
    private String themeCode;
    private List<TimeSlotResponse> timeSlots;
}
