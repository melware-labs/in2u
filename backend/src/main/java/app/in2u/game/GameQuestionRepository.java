package app.in2u.game;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GameQuestionRepository extends JpaRepository<GameQuestion, UUID> {

	List<GameQuestion> findByCoupleIdOrderByBatchAscPositionAsc(UUID coupleId);
}
