package app.in2u.game;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import app.in2u.couple.CoupleService;
import app.in2u.mood.MoodStream;
import app.in2u.user.CurrentUser;

/**
 * Juego "¿Cuánto me conoces?". Cada persona responde una pregunta sobre sí
 * misma y adivina la respuesta de su pareja. Lo que respondió la pareja solo
 * se revela a quien ya contestó esa pregunta, para que nadie copie.
 */
@RestController
@RequestMapping("/api/game")
class GameController {

	record AnswerRequest(@NotNull @Pattern(regexp = "[a-z0-9_]{1,40}") String questionKey,
			@Min(0) @Max(3) int self, @Min(0) @Max(3) int guess) {
	}

	/**
	 * Estado de una pregunta. Los campos de la pareja van null hasta que yo
	 * respondo; partnerAnswered siempre se informa.
	 */
	record QuestionState(String questionKey, Integer mySelf, Integer myGuess, boolean partnerAnswered,
			Integer partnerSelf, Integer partnerGuess) {
	}

	/** myScore: veces que adiviné a mi pareja; partnerScore: veces que me adivinó; rounds: preguntas que respondimos los dos. */
	record GameState(List<QuestionState> questions, int myScore, int partnerScore, int rounds) {
	}

	private final GameAnswerRepository answers;

	private final CoupleService couples;

	private final CurrentUser currentUser;

	private final MoodStream stream;

	GameController(GameAnswerRepository answers, CoupleService couples, CurrentUser currentUser, MoodStream stream) {
		this.answers = answers;
		this.couples = couples;
		this.currentUser = currentUser;
		this.stream = stream;
	}

	@GetMapping
	GameState state(@AuthenticationPrincipal OAuth2User principal) {
		var user = currentUser.of(principal);
		var couple = couples.requirePaired(user);
		UUID me = user.getId();

		var mine = new LinkedHashMap<String, GameAnswer>();
		var theirs = new LinkedHashMap<String, GameAnswer>();
		for (GameAnswer a : answers.findByCoupleId(couple.getId())) {
			(a.getUserId().equals(me) ? mine : theirs).put(a.getQuestionKey(), a);
		}
		var keys = new java.util.LinkedHashSet<String>(mine.keySet());
		keys.addAll(theirs.keySet());

		var questions = new ArrayList<QuestionState>();
		int myScore = 0;
		int partnerScore = 0;
		int rounds = 0;
		for (String key : keys) {
			GameAnswer m = mine.get(key);
			GameAnswer p = theirs.get(key);
			boolean reveal = m != null && p != null;
			if (reveal) {
				rounds++;
				if (m.getGuessChoice() == p.getSelfChoice()) {
					myScore++;
				}
				if (p.getGuessChoice() == m.getSelfChoice()) {
					partnerScore++;
				}
			}
			questions.add(new QuestionState(key, m == null ? null : m.getSelfChoice(),
					m == null ? null : m.getGuessChoice(), p != null, reveal ? p.getSelfChoice() : null,
					reveal ? p.getGuessChoice() : null));
		}
		return new GameState(questions, myScore, partnerScore, rounds);
	}

	/** Cada pregunta se responde una sola vez: así el puntaje no se puede arreglar después de ver la respuesta. */
	@PostMapping("/answers")
	@Transactional
	GameState answer(@AuthenticationPrincipal OAuth2User principal, @Valid @RequestBody AnswerRequest body) {
		var user = currentUser.of(principal);
		var couple = couples.requirePaired(user);
		if (answers.existsByUserIdAndQuestionKey(user.getId(), body.questionKey())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya respondiste esta pregunta.");
		}
		answers.save(new GameAnswer(couple.getId(), user.getId(), body.questionKey(), body.self(), body.guess()));
		stream.publish(couple.getId(), "game");
		return state(principal);
	}
}
