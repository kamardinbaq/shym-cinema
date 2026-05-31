package com.cinema.service;

import com.cinema.dto.response.AvailabilityGridResponse;
import com.cinema.entity.*;
import com.cinema.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class AvailabilityService {

    private final RoomRepository roomRepository;
    private final SlotReservationRepository slotReservationRepository;

    private static final LocalTime CINEMA_DAY_START = LocalTime.of(13, 0);
    private static final LocalTime QUEST_DAY_START  = LocalTime.of(11, 0);
    private static final ZoneId    ALMATY_ZONE      = ZoneId.of("Asia/Almaty");
    private static final DateTimeFormatter TIME_FMT  = DateTimeFormatter.ofPattern("HH:mm");

    @Transactional(readOnly = true)
    public AvailabilityGridResponse getGrid(LocalDate date) {
        return buildGrid(date, "CINEMA", CINEMA_DAY_START);
    }

    @Transactional(readOnly = true)
    public AvailabilityGridResponse getQuestGrid(LocalDate date) {
        return buildGrid(date, "QUEST", QUEST_DAY_START);
    }

    private AvailabilityGridResponse buildGrid(LocalDate date, String type, LocalTime businessDayStart) {
        LocalDate nextDay = date.plusDays(1);
        List<Room> rooms  = roomRepository.findAllActiveByTypeWithSlots(type);

        List<SlotReservation> reservations = slotReservationRepository
                .findAllByDates(List.of(date, nextDay));

        Set<String> reservedKeys = reservations.stream()
                .map(r -> r.getTimeSlot().getId() + "_" + r.getReservationDate())
                .collect(Collectors.toSet());

        ZonedDateTime nowAlmaty = ZonedDateTime.now(ALMATY_ZONE);

        List<AvailabilityGridResponse.RoomGridRow> rows = rooms.stream().map(room -> {
            List<AvailabilityGridResponse.SlotCell> cells = room.getTimeSlots().stream()
                    .filter(TimeSlot::isActive)
                    .sorted(Comparator.comparingLong(slot -> {
                        long mins    = slot.getStartTime().toSecondOfDay() / 60;
                        long bizMins = businessDayStart.toSecondOfDay() / 60;
                        return mins < bizMins ? mins + 1440 : mins;
                    }))
                    .map(slot -> {
                        // Night slots (before businessDayStart) physically happen on nextDay
                        LocalDate slotDate = slot.getStartTime().isBefore(businessDayStart)
                                ? nextDay : date;

                        LocalDate endDate = slotDate;
                        if (slot.getEndTime().isBefore(slot.getStartTime()) ||
                            slot.getEndTime().equals(LocalTime.MIDNIGHT)) {
                            endDate = slotDate.plusDays(1);
                        }
                        ZonedDateTime slotEnd = ZonedDateTime.of(endDate, slot.getEndTime(), ALMATY_ZONE);

                        boolean passed   = slotEnd.isBefore(nowAlmaty);
                        boolean reserved = reservedKeys.contains(slot.getId() + "_" + slotDate);

                        String status = passed ? "PASSED" : reserved ? "RESERVED" : "AVAILABLE";

                        return AvailabilityGridResponse.SlotCell.builder()
                                .timeSlotId(slot.getId())
                                .startTime(slot.getStartTime().format(TIME_FMT))
                                .endTime(slot.getEndTime().format(TIME_FMT))
                                .status(status)
                                .slotDate(slotDate.toString())
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
        }).collect(Collectors.toList());

        return AvailabilityGridResponse.builder()
                .date(date.toString())
                .rooms(rows)
                .build();
    }
}
