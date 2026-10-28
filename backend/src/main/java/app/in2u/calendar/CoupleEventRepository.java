package app.in2u.calendar;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CoupleEventRepository extends JpaRepository<CoupleEvent, UUID> {

	/** Los míos (cualquier visibilidad) y los "los_dos" de la pareja; nunca un "solo_yo" ajeno. */
	@Query("""
			select e from CoupleEvent e
			where e.coupleId = :coupleId
			  and e.startsAt >= :from and e.startsAt < :to
			  and (e.ownerId = :me or e.visibility = 'los_dos')
			order by e.startsAt""")
	List<CoupleEvent> visibleInRange(@Param("coupleId") UUID coupleId, @Param("me") UUID me,
			@Param("from") Instant from, @Param("to") Instant to);
}
