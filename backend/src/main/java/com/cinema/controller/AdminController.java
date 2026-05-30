package com.cinema.controller;

import com.cinema.dto.request.*;
import com.cinema.dto.response.*;
import com.cinema.entity.Admin;
import com.cinema.repository.AdminRepository;
import com.cinema.security.JwtUtils;
import com.cinema.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService          adminService;
    private final AdminRepository       adminRepository;
    private final JwtUtils              jwtUtils;
    private final AuthenticationManager authManager;

    /* ── Auth ── */
    @PostMapping("/auth/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody AdminLoginRequest req) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
        Admin admin = adminRepository.findByUsername(req.getUsername()).orElseThrow();
        return ApiResponse.ok(AuthResponse.builder()
                .token(jwtUtils.generateToken(admin))
                .username(admin.getUsername())
                .root(admin.isRoot())
                .build());
    }

    /* ── Slot toggling ── */
    @PostMapping("/slots/toggle")
    @PreAuthorize("hasAnyRole('ADMIN','ROOT')")
    public ApiResponse<Boolean> toggleSlot(
            @RequestParam Long timeSlotId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        boolean nowReserved = adminService.toggleSlot(timeSlotId, date);
        return ApiResponse.ok(nowReserved ? "Reserved" : "Available", nowReserved);
    }

    /* ── Settings ── */
    @GetMapping("/settings")
    @PreAuthorize("hasAnyRole('ADMIN','ROOT')")
    public ApiResponse<Map<String, String>> getSettings() {
        return ApiResponse.ok(adminService.getSettings());
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAnyRole('ADMIN','ROOT')")
    public ApiResponse<Void> updateSettings(@RequestBody Map<String, String> updates) {
        adminService.updateSettings(updates);
        return ApiResponse.ok("Saved", null);
    }

    /* ── Admin user management (root only) ── */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ROOT')")
    public ApiResponse<List<AdminUserResponse>> getAdmins() {
        return ApiResponse.ok(adminService.getAllAdmins());
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ROOT')")
    public ApiResponse<AdminUserResponse> createAdmin(@Valid @RequestBody CreateAdminRequest req) {
        return ApiResponse.ok(adminService.createAdmin(req));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ROOT')")
    public ApiResponse<Void> deleteAdmin(
            @PathVariable Long id,
            @AuthenticationPrincipal Admin me) {
        adminService.deleteAdmin(id, me.getUsername());
        return ApiResponse.ok("Deleted", null);
    }
}
