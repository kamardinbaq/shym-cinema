package com.cinema.dto.response;
import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AvailabilityGridResponse {
    private String date;
    private int sessionPrice;
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
        private String status;            // AVAILABLE | PENDING | RESERVED | PASSED
        private Long reservationId;       // null when available
        private String slotDate;          // actual calendar date for this slot (night slots belong to date+1)
        private String pendingExpiresAt;  // ISO datetime — only set when status=PENDING
    }
}
