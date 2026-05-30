package com.cinema.repository;
import com.cinema.entity.Setting;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SettingRepository extends JpaRepository<Setting, String> {}
