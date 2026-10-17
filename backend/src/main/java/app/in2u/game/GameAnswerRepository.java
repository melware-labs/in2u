package app.in2u.game;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GameAnswerRepository extends JpaRepository<GameAnswer, UUID> {

	List<GameAnswer> findByCoupleId(UUID coupleId);

	boolean existsByUserIdAndQuestionKey(UUID userId, String questionKey);
}
