package app.in2u.cycle;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cycle_settings")
public class CycleSettings {

	public static final int DEFAULT_CYCLE_DAYS = 29;

	public static final int DEFAULT_PERIOD_DAYS = 5;

	@Id
	private UUID userId;

	@Column(name = "average_cycle_length_days", nullable = false)
	private short cycleLengthDays = DEFAULT_CYCLE_DAYS;

	@Column(name = "average_period_length_days", nullable = false)
	private short periodLengthDays = DEFAULT_PERIOD_DAYS;

	/** nada | avisos | fase_y_avisos */
	@Column(nullable = false)
	private String partnerVisibility = "nada";

	@Column(nullable = false)
	private Instant updatedAt = Instant.now();

	protected CycleSettings() {
	}

	public CycleSettings(UUID userId) {
		this.userId = userId;
	}

	public void update(int cycleLengthDays, int periodLengthDays, String partnerVisibility) {
		this.cycleLengthDays = (short) cycleLengthDays;
		this.periodLengthDays = (short) periodLengthDays;
		this.partnerVisibility = partnerVisibility;
		this.updatedAt = Instant.now();
	}

	public int getCycleLengthDays() {
		return cycleLengthDays;
	}

	public int getPeriodLengthDays() {
		return periodLengthDays;
	}

	public String getPartnerVisibility() {
		return partnerVisibility;
	}
}
