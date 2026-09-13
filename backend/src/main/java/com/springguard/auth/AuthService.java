package com.springguard.auth;

import com.springguard.model.entity.User;
import com.springguard.repo.UserRepository;
import com.springguard.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public AuthResponse register(RegisterRequest req) {
        if (req.email() == null || req.email().isBlank() || req.password() == null || req.password().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter an email and a password of at least 6 characters.");
        }
        if (users.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That email is already registered.");
        }
        User user = new User();
        user.setEmail(req.email());
        user.setPasswordHash(encoder.encode(req.password()));
        users.save(user);
        return new AuthResponse(jwt.generate(user.getEmail()), user.getEmail());
    }

    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmail(req.email() == null ? "" : req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));
        if (!encoder.matches(req.password() == null ? "" : req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
        return new AuthResponse(jwt.generate(user.getEmail()), user.getEmail());
    }
}
