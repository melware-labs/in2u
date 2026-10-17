package app.in2u.album;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AlbumPhotoRepository extends JpaRepository<AlbumPhoto, UUID> {

	@Query("""
			select new app.in2u.album.PhotoInfo(p.id, p.uploaderId, p.title, p.description, p.createdAt)
			from AlbumPhoto p where p.coupleId = :coupleId order by p.createdAt desc""")
	List<PhotoInfo> listFor(@Param("coupleId") UUID coupleId);

	long countByCoupleId(UUID coupleId);
}
