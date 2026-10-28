package app.in2u.game;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Una pregunta generada para una pareja, en español e inglés. */
@Entity
@Table(name = "game_questions")
public class GameQuestion {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID coupleId;

	@Column(nullable = false, unique = true)
	private String questionKey;

	@Column(nullable = false)
	private int batch;

	@Column(nullable = false)
	private short position;

	@Column(nullable = false)
	private String textEs;

	@Column(nullable = false)
	private String optionsEs;

	@Column(nullable = false)
	private String textEn;

	@Column(nullable = false)
	private String optionsEn;

	/** "gemini" o "reserva". */
	@Column(nullable = false)
	private String source;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected GameQuestion() {
	}

	GameQuestion(UUID coupleId, String questionKey, int batch, int position, QuestionDraft draft, String source) {
		this.coupleId = coupleId;
		this.questionKey = questionKey;
		this.batch = batch;
		this.position = (short) position;
		this.textEs = draft.textEs();
		this.optionsEs = String.join("\n", draft.optionsEs());
		this.textEn = draft.textEn();
		this.optionsEn = String.join("\n", draft.optionsEn());
		this.source = source;
	}

	public String getQuestionKey() {
		return questionKey;
	}

	public int getBatch() {
		return batch;
	}

	public String getTextEs() {
		return textEs;
	}

	public List<String> getOptionsEs() {
		return List.of(optionsEs.split("\n"));
	}

	public String getTextEn() {
		return textEn;
	}

	public List<String> getOptionsEn() {
		return List.of(optionsEn.split("\n"));
	}
}
