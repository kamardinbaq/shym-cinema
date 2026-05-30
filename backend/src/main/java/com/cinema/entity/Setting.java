package com.cinema.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Setting {
    @Id @Column(length = 100)
    private String key;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String value;
}
