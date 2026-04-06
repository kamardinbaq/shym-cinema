package com.cinema.service.impl;

import com.cinema.dto.response.AvailabilityGridResponse;
import com.cinema.dto.response.RoomResponse;
import com.cinema.dto.response.TimeSlotResponse;
import com.cinema.entity.Reservation;
import com.cinema.entity.ReservationStatus;
import com.cinema.entity.Room;
import com.cinema.entity.TimeSlot;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.repository.ReservationRepository;
import com.cinema.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {

    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;

    @Value("${app.session-price:3500}")
    private int sessionPrice;

    @Transactional(readOnly = true)
    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAllActiveWithSlots().stream()
                .map(this::toRoomResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", id));
        return toRoomResponse(room);
    }

    // Business day starts at 13:00. Slots before this time (01:00-04:00) belong to the next calendar day.
    private static final LocalTime BUSINESS_DAY_START = LocalTime.of(13, 0);
    private static final ZoneId    ALMATY_ZONE        = ZoneId.of("Asia/Almaty");
    // Slots starting within this many minutes are treated as already passed
    private static final int       BOOKING_CUTOFF_MINUTES = 30;

    @Transactional(readOnly = true)
    public AvailabilityGridResponse getAvailabilityGrid(LocalDate date) {
        LocalDate nextDay = date.plusDays(1);
        List<Room> rooms = roomRepository.findAllActiveWithSlots();

        // Fetch reservations for both calendar dates that make up this business day
        List<Reservation> activeReservations = reservationRepository.findAllActiveByDates(List.of(date, nextDay));

        // Build lookup: "roomId_slotId_calendarDate" → Reservation
        Map<String, Reservation> bookedSlots = new HashMap<>();
        for (Reservation r : activeReservations) {
            String key = r.getRoom().getId() + "_" + r.getTimeSlot().getId() + "_" + r.getReservationDate();
            bookedSlots.put(key, r);
        }

        // Current time in Almaty. A slot is "passed" if it started more than BOOKING_CUTOFF_MINUTES ago.
        ZonedDateTime nowAlmaty = ZonedDateTime.now(ALMATY_ZONE);

        List<AvailabilityGridResponse.RoomGridRow> rows = rooms.stream()
                .map(room -> {
                    List<AvailabilityGridResponse.SlotCell> cells = room.getTimeSlots().stream()
                            .filter(TimeSlot::isActive)
                            // Business day order: 13:00-23:00 first, then 01:00-04:00
                            .sorted(Comparator.comparingLong(slot -> {
                                long mins = slot.getStartTime().toSecondOfDay() / 60;
                                long bizStart = BUSINESS_DAY_START.toSecondOfDay() / 60;
                                return mins < bizStart ? mins + 1440 : mins;
                            }))
                            .map(slot -> {
                                // Night slots (01:00-04:00) physically occur on the next calendar day
                                LocalDate slotDate = slot.getStartTime().isBefore(BUSINESS_DAY_START) ? nextDay : date;
                                ZonedDateTime slotDateTime = ZonedDateTime.of(slotDate, slot.getStartTime(), ALMATY_ZONE);

                                String key = room.getId() + "_" + slot.getId() + "_" + slotDate;
                                Reservation reservation = bookedSlots.get(key);
                                boolean passed = slotDateTime.isBefore(nowAlmaty.minusMinutes(BOOKING_CUTOFF_MINUTES));

                                String status;
                                String pendingExpiresAt = null;

                                if (reservation != null) {
                                    if (reservation.getStatus() == ReservationStatus.PENDING) {
                                        status = "PENDING";
                                        // Expiry = createdAt + 10 minutes (matches ReservationExpiryScheduler)
                                        // Append "Z" so the browser parses it as UTC, not local time
                                        pendingExpiresAt = reservation.getCreatedAt()
                                                .plusMinutes(10)
                                                .toString() + "Z";
                                    } else {
                                        status = "RESERVED";
                                    }
                                } else if (passed) {
                                    status = "PASSED";
                                } else {
                                    status = "AVAILABLE";
                                }

                                return AvailabilityGridResponse.SlotCell.builder()
                                        .timeSlotId(slot.getId())
                                        .startTime(slot.getStartTime().toString())
                                        .endTime(slot.getEndTime().toString())
                                        .status(status)
                                        .reservationId(reservation != null ? reservation.getId() : null)
                                        .slotDate(slotDate.format(DateTimeFormatter.ISO_LOCAL_DATE))
                                        .pendingExpiresAt(pendingExpiresAt)
                                        .build();
                            })
                            .collect(Collectors.toList());

                    return AvailabilityGridResponse.RoomGridRow.builder()
                            .roomId(room.getId())
                            .roomName(room.getName())
                            .themeCode(room.getThemeCode())
                            .capacity(room.getCapacity())
                            .minPeople(room.getMinPeople())
                            .slots(cells)
                            .build();
                })
                .collect(Collectors.toList());

        return AvailabilityGridResponse.builder()
                .date(date.format(DateTimeFormatter.ISO_LOCAL_DATE))
                .sessionPrice(sessionPrice)
                .rooms(rows)
                .build();
    }

    private RoomResponse toRoomResponse(Room room) {
        List<TimeSlotResponse> slots = room.getTimeSlots().stream()
                .filter(TimeSlot::isActive)
                .sorted(Comparator.comparing(TimeSlot::getStartTime))
                .map(s -> TimeSlotResponse.builder()
                        .id(s.getId())
                        .roomId(room.getId())
                        .startTime(s.getStartTime().toString())
                        .endTime(s.getEndTime().toString())
                        .active(s.isActive())
                        .build())
                .collect(Collectors.toList());

        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .description(room.getDescription())
                .capacity(room.getCapacity())
                .minPeople(room.getMinPeople())
                .themeCode(room.getThemeCode())
                .timeSlots(slots)
                .build();
    }
}
