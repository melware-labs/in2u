package app.in2u.cycle;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

/** Todas las consultas del ciclo filtran por userId: nunca se lee el ciclo de otra persona directo. */
public interface CyclePeriodRepository extends JpaRepository<CyclePeriod, UUID> {

	List<CyclePeriod> findByUserIdOrderByStartDateDesc(UUID userId, Pageable page);

	Optional<CyclePeriod> findByUserIdAndStartDate(UUID userId, LocalDate startDate);

	@Modifying
	long deleteByUserIdAndStartDate(UUID userId, LocalDate startDate);
}
