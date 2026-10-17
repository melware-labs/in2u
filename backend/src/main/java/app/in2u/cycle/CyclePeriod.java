package app.in2u.cycle;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cycle_periods")
public class CyclePeriod {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID userId;

	@Column(nullable = false)
	private LocalDate startDate;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected CyclePeriod() {
	}

	public CyclePeriod(UUID userId, LocalDate startDate) {
		this.userId = userId;
		this.startDate = startDate;
	}

	public LocalDate getStartDate() {
		return startDate;
	}
}
