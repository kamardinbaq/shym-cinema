package com.cinema.service.impl;

import com.cinema.dto.request.AdminReservationRequest;
import com.cinema.dto.response.ReservationResponse;
import com.cinema.entity.*;
import com.cinema.exception.*;
import com.cinema.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
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
    private final UsedReceiptRepository usedReceiptRepository;

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

    /**
     * Looks up a PENDING reservation by its confirmation code. Used by the Telegram bot
     * to validate the code before asking for the receipt PDF.
     */
    @Transactional(readOnly = true)
    public Optional<Reservation> findPendingReservationByCode(String code) {
        return reservationRepository.findByConfirmationCodeAndStatus(
                code.toUpperCase(), ReservationStatus.PENDING);
    }

    /**
     * Confirms a reservation ONLY after verifying the Kaspi receipt.
     * Atomically saves the receipt number so it cannot be reused.
     *
     * Race-condition safety:
     *  - Receipt is saved FIRST so the DB unique constraint fires before the reservation
     *    is mutated. If two concurrent requests arrive with the same receipt number the
     *    second one gets a DataIntegrityViolationException from the DB, not a silent pass.
     *  - The @Transactional boundary ensures both writes either commit together or roll back.
     */
    @Transactional
    public ReservationResponse confirmReservationWithReceipt(Long reservationId, String receiptNumber) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Cannot confirm a cancelled reservation");
        }
        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            throw new BusinessException("Reservation is already confirmed");
        }

        // Save receipt FIRST — the DB unique constraint on receipt_number is the real
        // guard against double-use, catching concurrent requests that pass the status
        // check simultaneously.
        try {
            UsedReceipt usedReceipt = new UsedReceipt();
            usedReceipt.setReceiptNumber(receiptNumber);
            usedReceipt.setReservationId(reservationId);
            usedReceiptRepository.saveAndFlush(usedReceipt);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException("Receipt already used");
        }

        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservationRepository.save(reservation);

        log.info("[ADMIN] Reservation confirmed with receipt: id={}, receipt={}", reservationId, receiptNumber);
        return reservationService.toResponse(reservation);
    }
}
