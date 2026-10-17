package app.in2u.game;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "game_answers")
public class GameAnswer {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID coupleId;

	@Column(nullable = false)
	private UUID userId;

	@Column(nullable = false)
	private String questionKey;

	/** Lo que la persona responde sobre sí misma (0-3). */
	@Column(nullable = false)
	private short selfChoice;

	/** Lo que cree que respondió su pareja (0-3). */
	@Column(nullable = false)
	private short guessChoice;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected GameAnswer() {
	}

	public GameAnswer(UUID coupleId, UUID userId, String questionKey, int selfChoice, int guessChoice) {
		this.coupleId = coupleId;
		this.userId = userId;
		this.questionKey = questionKey;
		this.selfChoice = (short) selfChoice;
		this.guessChoice = (short) guessChoice;
	}

	public UUID getUserId() {
		return userId;
	}

	public String getQuestionKey() {
		return questionKey;
	}

	public int getSelfChoice() {
		return selfChoice;
	}

	public int getGuessChoice() {
		return guessChoice;
	}
}
