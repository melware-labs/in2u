package app.in2u.tips;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyTipRepository extends JpaRepository<DailyTip, UUID> {

	Optional<DailyTip> findByForUserIdAndTipDate(UUID forUserId, LocalDate tipDate);
}
