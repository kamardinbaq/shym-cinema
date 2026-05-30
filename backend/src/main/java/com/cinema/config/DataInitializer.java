package com.cinema.config;

import com.cinema.entity.Admin;
import com.cinema.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.root-admin.username}")
    private String rootUsername;

    @Value("${app.root-admin.password}")
    private String rootPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (adminRepository.findByUsername(rootUsername).isEmpty()) {
            adminRepository.save(Admin.builder()
                    .username(rootUsername)
                    .password(passwordEncoder.encode(rootPassword))
                    .root(true)
                    .build());
            log.info("Root admin '{}' created", rootUsername);
        }
    }
}
