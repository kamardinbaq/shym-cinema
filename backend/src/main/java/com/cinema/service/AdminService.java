package com.cinema.service;

import com.cinema.dto.request.CreateAdminRequest;
import com.cinema.dto.response.AdminUserResponse;
import com.cinema.entity.*;
import com.cinema.exception.*;
import com.cinema.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class AdminService {

    private static final Set<String> ALLOWED_SETTING_KEYS = Set.of(
        "whatsapp_number", "youtube_url", "youtube_url_2", "hero_bg",
        "quest_whatsapp_number", "quest_youtube_url", "quest_hero_bg"
    );

    private final AdminRepository         adminRepository;
    private final SlotReservationRepository slotRepository;
    private final TimeSlotRepository      timeSlotRepository;
    private final SettingRepository       settingRepository;
    private final PasswordEncoder         passwordEncoder;

    /** Toggle: returns true if slot is NOW reserved, false if now available */
    @Transactional
    public boolean toggleSlot(Long timeSlotId, LocalDate date) {
        Optional<SlotReservation> existing = slotRepository.findBySlotAndDate(timeSlotId, date);
        if (existing.isPresent()) {
            slotRepository.delete(existing.get());
            return false;
        }
        TimeSlot slot = timeSlotRepository.findById(timeSlotId)
                .orElseThrow(() -> new ResourceNotFoundException("TimeSlot", timeSlotId));
        slotRepository.save(SlotReservation.builder()
                .room(slot.getRoom()).timeSlot(slot).reservationDate(date).build());
        return true;
    }

    @Transactional(readOnly = true)
    public Map<String, String> getSettings() {
        Map<String, String> map = new LinkedHashMap<>();
        settingRepository.findAll().forEach(s -> map.put(s.getKey(), s.getValue()));
        return map;
    }

    @Transactional
    public void updateSettings(Map<String, String> updates) {
        updates.forEach((k, v) -> {
            if (!ALLOWED_SETTING_KEYS.contains(k))
                throw new BusinessException("Unknown setting key: " + k);
            Setting s = settingRepository.findById(k).orElse(new Setting(k, v));
            s.setValue(v);
            settingRepository.save(s);
        });
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllAdmins() {
        return adminRepository.findAll().stream()
                .map(a -> AdminUserResponse.builder()
                        .id(a.getId()).username(a.getUsername())
                        .root(a.isRoot()).createdAt(a.getCreatedAt()).build())
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminUserResponse createAdmin(CreateAdminRequest req) {
        if (adminRepository.existsByUsername(req.getUsername()))
            throw new BusinessException("Username already taken: " + req.getUsername());
        Admin saved = adminRepository.save(Admin.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .root(false).build());
        return AdminUserResponse.builder()
                .id(saved.getId()).username(saved.getUsername())
                .root(saved.isRoot()).createdAt(saved.getCreatedAt()).build();
    }

    @Transactional
    public void deleteAdmin(Long id, String currentUsername) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", id));
        if (admin.isRoot()) throw new BusinessException("Cannot delete root admin");
        if (admin.getUsername().equals(currentUsername))
            throw new BusinessException("Cannot delete yourself");
        adminRepository.delete(admin);
    }
}
