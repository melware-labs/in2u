package app.in2u.tips;

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
@Table(name = "daily_tips")
public class DailyTip {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID coupleId;

	@Column(nullable = false)
	private UUID forUserId;

	@Column(nullable = false)
	private UUID basedOnUserId;

	@Column(nullable = false)
	private String tipKey;

	@Column(nullable = false)
	private String kickerText;

	@Column(nullable = false)
	private String adviceText;

	@Column(nullable = false)
	private String source;

	@Column(nullable = false)
	private LocalDate tipDate;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected DailyTip() {
	}

	public DailyTip(UUID coupleId, UUID forUserId, UUID basedOnUserId, LocalDate tipDate) {
		this.coupleId = coupleId;
		this.forUserId = forUserId;
		this.basedOnUserId = basedOnUserId;
		this.tipDate = tipDate;
	}

	public void apply(TipSuggestion s) {
		this.tipKey = s.tipKey();
		this.kickerText = s.kicker();
		this.adviceText = s.advice();
		this.source = s.source();
		this.createdAt = Instant.now();
	}

	public String getTipKey() {
		return tipKey;
	}

	public String getKickerText() {
		return kickerText;
	}

	public String getAdviceText() {
		return adviceText;
	}

	public String getSource() {
		return source;
	}

	public LocalDate getTipDate() {
		return tipDate;
	}
}
