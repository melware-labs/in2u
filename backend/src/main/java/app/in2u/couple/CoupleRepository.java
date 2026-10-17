package app.in2u.couple;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CoupleRepository extends JpaRepository<Couple, UUID> {

	@Query("select c from Couple c where c.memberOne = :userId or c.memberTwo = :userId")
	Optional<Couple> findByMember(@Param("userId") UUID userId);

	boolean existsByInviteCode(String inviteCode);

	/**
	 * Unirse es un único UPDATE condicional (como join_couple() en Supabase):
	 * si dos personas usan el mismo código a la vez, solo una lo consigue.
	 */
	@Modifying
	@Query("""
			update Couple c set c.memberTwo = :userId
			where c.inviteCode = :code and c.memberTwo is null and c.memberOne <> :userId""")
	int claim(@Param("code") String code, @Param("userId") UUID userId);

	Optional<Couple> findByInviteCode(String inviteCode);
}
