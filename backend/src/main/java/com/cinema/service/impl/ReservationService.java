package com.cinema.service.impl;

import com.cinema.dto.request.ReservationRequest;
import com.cinema.dto.response.PaymentResponse;
import com.cinema.dto.response.ReservationResponse;
import com.cinema.entity.*;
import com.cinema.exception.*;
import com.cinema.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final UserRepository userRepository;

    /**
     * Create a new reservation with pessimistic write lock to prevent double-booking.
     * Business rules enforced:
     *   - Slot must not already be booked for that date
     *   - peopleCount must be >= room.minPeople
     *   - peopleCount must be <= room.capacity
     */
    @Transactional
    public ReservationResponse createReservation(ReservationRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room", request.getRoomId()));

        if (!room.isActive()) {
            throw new BusinessException("Room is not available for booking");
        }

        TimeSlot slot = timeSlotRepository.findById(request.getTimeSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("TimeSlot", request.getTimeSlotId()));

        if (!slot.getRoom().getId().equals(room.getId())) {
            throw new BusinessException("Time slot does not belong to the selected room");
        }

        // Validate people count
        if (request.getPeopleCount() < room.getMinPeople()) {
            throw new BusinessException(
                String.format("Minimum %d people required for %s", room.getMinPeople(), room.getName()));
        }
        if (request.getPeopleCount() > room.getCapacity()) {
            throw new BusinessException(
                String.format("Maximum capacity is %d people for %s", room.getCapacity(), room.getName()));
        }

        // Reject if the session already started (using Almaty time)
        ZonedDateTime slotDateTime = ZonedDateTime.of(
                request.getReservationDate(), slot.getStartTime(), ZoneId.of("Asia/Almaty"));
        if (slotDateTime.isBefore(ZonedDateTime.now(ZoneId.of("Asia/Almaty")))) {
            throw new BusinessException("Cannot book a session that has already started");
        }

        // Check for existing booking — uses PESSIMISTIC_WRITE lock
        boolean alreadyBooked = reservationRepository
                .findActiveByRoomSlotDate(room.getId(), slot.getId(), request.getReservationDate())
                .isPresent();

        if (alreadyBooked) {
            throw new SlotAlreadyBookedException();
        }

        Reservation reservation = Reservation.builder()
                .user(user)
                .room(room)
                .timeSlot(slot)
                .reservationDate(request.getReservationDate())
                .peopleCount(request.getPeopleCount())
                .status(ReservationStatus.PENDING)
                .notes(request.getNotes())
                .build();

        reservation = reservationRepository.save(reservation);
        log.info("Reservation created: id={}, user={}, room={}, date={}",
                reservation.getId(), username, room.getName(), request.getReservationDate());

        return toResponse(reservation);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getUserReservations(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return reservationRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReservationResponse getReservationById(Long id, String username) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Allow admin or the owner
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isAdmin && !reservation.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You don't have access to this reservation");
        }

        return toResponse(reservation);
    }

    @Transactional
    public void cancelReservation(Long id, String username) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isAdmin && !reservation.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You don't have permission to cancel this reservation");
        }

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Reservation is already cancelled");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);
        log.info("Reservation cancelled: id={} by user={}", id, username);
    }

    // Called by PaymentService after successful payment
    @Transactional
    public void confirmReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservationRepository.save(reservation);
    }

    public ReservationResponse toResponse(Reservation r) {
        PaymentResponse paymentResponse = null;
        if (r.getPayment() != null) {
            Payment p = r.getPayment();
            paymentResponse = PaymentResponse.builder()
                    .id(p.getId())
                    .reservationId(r.getId())
                    .amount(p.getAmount())
                    .currency(p.getCurrency())
                    .provider(p.getProvider())
                    .status(p.getStatus().name())
                    .transactionId(p.getTransactionId())
                    .kaspiOrderId(p.getKaspiOrderId())
                    .paidAt(p.getPaidAt())
                    .createdAt(p.getCreatedAt())
                    .build();
        }

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

        return ReservationResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .username(r.getUser().getUsername())
                .roomId(r.getRoom().getId())
                .roomName(r.getRoom().getName())
                .timeSlotId(r.getTimeSlot().getId())
                .startTime(r.getTimeSlot().getStartTime().format(timeFmt))
                .endTime(r.getTimeSlot().getEndTime().format(timeFmt))
                .reservationDate(r.getReservationDate().toString())
                .peopleCount(r.getPeopleCount())
                .status(r.getStatus().name())
                .notes(r.getNotes())
                .payment(paymentResponse)
                .createdAt(r.getCreatedAt())
                .build();
    }
}
