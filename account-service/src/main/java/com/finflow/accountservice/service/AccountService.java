package com.finflow.accountservice.service;


import com.finflow.accountservice.dto.AccountResponse;
import com.finflow.accountservice.dto.CreateAccountRequest;
import com.finflow.accountservice.entity.Account;
import com.finflow.accountservice.entity.AccountStatus;
import com.finflow.accountservice.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class AccountService {
    private final AccountRepository accountRepository;

    public AccountResponse createAccount(CreateAccountRequest request){
        log.info("Creating account for: {}", request.getEmail());

        if(accountRepository.existByEmail(request.getEmail())){
            throw new RuntimeException("Account already exists for email: "+request.getEmail());
        }

        Account account = new Account();
        account.setAccountHolderName(request.getAccountHolderName());
        account.setEmail(request.getEmail());
        account.setPhone(request.getPhone());
        account.setAccountStatus(AccountStatus.ACTIVE);
        account.setBalance(request.getInitialDeposit());
        account.setAccountNumber();
    }
}
