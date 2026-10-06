package com.finflow.accountservice.dto;

import com.finflow.accountservice.entity.AccountStatus;
import com.finflow.accountservice.entity.AccountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AccountResponse {
    private String id;
    private String accountNumber;
    private String accountHolderName;
    private String email;
    private String phone;
    private AccountType accountType;
    private AccountStatus accountStatus;
    private BigDecimal balance;
    private BigDecimal dailyTransactionLimit;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
