package com.finflow.accountservice.repository;

import com.finflow.accountservice.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, String> {
    boolean existByEmail(String email);
}
