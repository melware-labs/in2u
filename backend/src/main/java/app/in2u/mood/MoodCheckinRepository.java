package app.in2u.mood;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MoodCheckinRepository extends JpaRepository<MoodCheckin, UUID> {

	Optional<MoodCheckin> findByUserIdAndCheckinDate(UUID userId, LocalDate date);

	List<MoodCheckin> findByUserIdOrderByCheckinDateDesc(UUID userId, Pageable page);

	List<MoodCheckin> findByCoupleIdAndCheckinDateGreaterThanEqual(UUID coupleId, LocalDate from);
}
