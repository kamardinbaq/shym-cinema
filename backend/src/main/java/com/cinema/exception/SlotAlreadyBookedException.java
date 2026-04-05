package com.cinema.exception;
public class SlotAlreadyBookedException extends RuntimeException {
    public SlotAlreadyBookedException() {
        super("This time slot is already booked for the selected date.");
    }
}
