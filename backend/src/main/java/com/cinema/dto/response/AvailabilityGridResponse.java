package com.cinema.dto.response;
import lombok.*;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AvailabilityGridResponse {
    private String date;
    private List<RoomGridRow> rooms;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RoomGridRow {
        private Long roomId;
        private String roomName;
        private String themeCode;
        private int capacity;
        private int minPeople;
        private List<SlotCell> slots;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SlotCell {
        private Long timeSlotId;
        private String startTime;
        private String endTime;
        private String status;   // AVAILABLE | RESERVED | PASSED
        private String slotDate; // actual calendar date for this slot
    }
}
