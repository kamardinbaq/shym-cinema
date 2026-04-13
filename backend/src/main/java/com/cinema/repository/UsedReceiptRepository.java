package com.cinema.repository;

import com.cinema.entity.UsedReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsedReceiptRepository extends JpaRepository<UsedReceipt, Long> {
    boolean existsByReceiptNumber(String receiptNumber);
}
