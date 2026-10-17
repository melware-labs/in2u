package app.in2u.chat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

	List<ChatMessage> findByCoupleIdOrderByCreatedAtDesc(UUID coupleId, Limit limit);

	List<ChatMessage> findByCoupleIdAndCreatedAtBeforeOrderByCreatedAtDesc(UUID coupleId, Instant before, Limit limit);
}
