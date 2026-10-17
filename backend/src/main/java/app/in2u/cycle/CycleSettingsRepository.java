package app.in2u.cycle;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CycleSettingsRepository extends JpaRepository<CycleSettings, UUID> {
}
