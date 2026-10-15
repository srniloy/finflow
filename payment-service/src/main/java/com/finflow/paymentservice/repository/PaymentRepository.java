package com.finflow.paymentservice.repository;

import com.finflow.paymentservice.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {

    Optional<Payment> findByRazorpayOrderId(String orderId);
}
