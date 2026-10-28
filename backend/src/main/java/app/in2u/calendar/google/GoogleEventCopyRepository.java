package app.in2u.calendar.google;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface GoogleEventCopyRepository extends JpaRepository<GoogleEventCopy, GoogleEventCopy.Key> {

	List<GoogleEventCopy> findByEventId(UUID eventId);

	boolean existsByEventIdAndUserId(UUID eventId, UUID userId);

	void deleteByUserId(UUID userId);
}
