package app.in2u.cycle;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CycleDailyLogRepository extends JpaRepository<CycleDailyLog, UUID> {

	Optional<CycleDailyLog> findByUserIdAndLogDate(UUID userId, LocalDate logDate);
}
