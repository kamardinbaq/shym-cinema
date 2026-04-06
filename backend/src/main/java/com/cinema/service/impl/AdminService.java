package com.cinema.service.impl;

import com.cinema.dto.request.AdminReservationRequest;
import com.cinema.dto.response.ReservationResponse;
import com.cinema.entity.*;
import com.cinema.exception.*;
import com.cinema.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final UserRepository userRepository;
    private final ReservationService reservationService;

    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllReservations() {
        return reservationRepository.findAllWithDetails()
                .stream().map(reservationService::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservationsByDate(LocalDate date) {
        return reservationRepository.findAllByDateWithDetails(date)
                .stream().map(reservationService::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservationsByRoomAndDate(Long roomId, LocalDate date) {
        return reservationRepository.findByRoomAndDate(roomId, date)
                .stream().map(reservationService::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ReservationResponse createReservation(AdminReservationRequest req) {
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", req.getUserId()));

        Room room = roomRepository.findById(req.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room", req.getRoomId()));

        TimeSlot slot = timeSlotRepository.findById(req.getTimeSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("TimeSlot", req.getTimeSlotId()));

        if (!slot.getRoom().getId().equals(room.getId())) {
            throw new BusinessException("Time slot does not belong to the selected room");
        }

        if (req.getPeopleCount() < room.getMinPeople()) {
            throw new BusinessException("Minimum people: " + room.getMinPeople());
        }
        if (req.getPeopleCount() > room.getCapacity()) {
            throw new BusinessException("Exceeds room capacity: " + room.getCapacity());
        }

        boolean alreadyBooked = reservationRepository
                .findActiveByRoomSlotDate(room.getId(), slot.getId(), req.getReservationDate())
                .isPresent();
        if (alreadyBooked) throw new SlotAlreadyBookedException();

        ReservationStatus status = req.isSkipPayment()
                ? ReservationStatus.CONFIRMED
                : ReservationStatus.PENDING;

        Reservation reservation = Reservation.builder()
                .user(user)
                .room(room)
                .timeSlot(slot)
                .reservationDate(req.getReservationDate())
                .peopleCount(req.getPeopleCount())
                .status(status)
                .notes(req.getNotes())
                .build();

        reservation = reservationRepository.save(reservation);
        log.info("[ADMIN] Reservation created: id={}, room={}, date={}", reservation.getId(),
                room.getName(), req.getReservationDate());

        return reservationService.toResponse(reservation);
    }

    @Transactional
    public void cancelReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", id));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Already cancelled");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);
        log.info("[ADMIN] Reservation cancelled: id={}", id);
    }

    @Transactional
    public ReservationResponse confirmReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", id));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Cannot confirm a cancelled reservation");
        }
        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            throw new BusinessException("Reservation is already confirmed");
        }

        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservationRepository.save(reservation);
        log.info("[ADMIN] Reservation confirmed: id={}", id);
        return reservationService.toResponse(reservation);
    }
}
