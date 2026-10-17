package app.in2u.user;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

	Optional<AppUser> findByAuthSubject(String authSubject);
}
