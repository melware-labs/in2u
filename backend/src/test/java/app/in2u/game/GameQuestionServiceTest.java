package app.in2u.game;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.ObjectMapper;

class GameQuestionServiceTest {

	@Test
	void parsesGeminiQuestions_andDropsInvalidOnes() throws Exception {
		String json = """
				{"questions":[
				  {"es":"¿Qué fruta eliges?","es_options":["Mango","Fresa","Uva","Kiwi"],
				   "en":"Which fruit do you pick?","en_options":["Mango","Strawberry","Grape","Kiwi"]},
				  {"es":"Solo tres opciones","es_options":["a","b","c"],"en":"Only three","en_options":["a","b","c"]},
				  {"es":"Opciones repetidas","es_options":["Sí","si","No","Nunca"],"en":"Repeated","en_options":["Yes","Yes!","No","Never"]}
				]}""";
		var drafts = GameQuestionService.parse(new ObjectMapper().readTree(json));
		assertThat(drafts).hasSize(1);
		assertThat(drafts.get(0).textEn()).isEqualTo("Which fruit do you pick?");
		assertThat(GameQuestionService.parse(new ObjectMapper().readTree("{}"))).isEmpty();
	}

	@Test
	void promptListsQuestionsToAvoid() {
		assertThat(GameQuestionService.prompt(List.of("¿Qué comida elegirías para siempre?")))
			.contains("¿Qué comida elegirías para siempre?")
			.contains("10 preguntas");
	}

	@Test
	void reserveHasNoRepeatsWithBuiltIns() {
		var all = new java.util.ArrayList<String>(GameQuestionBank.BUILT_IN_ES);
		GameQuestionBank.RESERVE.forEach(q -> all.add(q.textEs()));
		assertThat(all.stream().map(QuestionDraft::normalize)).doesNotHaveDuplicates();
		assertThat(GameQuestionBank.RESERVE).hasSize(30);
	}

	@Test
	void generatorNeverRunsOut_andEveryQuestionIsValidAndUnique() {
		var random = new java.util.Random(7);
		var seen = new java.util.HashSet<String>();
		for (int batch = 0; batch < 300; batch++) {
			var drafts = QuestionGenerator.next(GameQuestionService.BATCH_SIZE, random);
			assertThat(drafts).hasSize(GameQuestionService.BATCH_SIZE);
			assertThat(drafts.stream().map(QuestionDraft::textEs)).doesNotHaveDuplicates();
			for (var d : drafts) {
				assertThat(d.optionsEs()).hasSize(4).doesNotHaveDuplicates();
				assertThat(d.optionsEn()).hasSize(4);
				seen.add(GameQuestionService.combo(d.textEs(), d.optionsEs()));
			}
		}
		// 3000 preguntas sorteadas: algunas se repiten al azar (el servicio las descarta contra las ya hechas),
		// pero hay miles de combinaciones distintas.
		assertThat(seen.size()).isGreaterThan(2000);
		assertThat(QuestionGenerator.templateCount()).isGreaterThanOrEqualTo(GameQuestionService.BATCH_SIZE);
	}

	@Test
	void templatesUseNeutralTuteoWithoutVoseo() {
		var random = new java.util.Random(1);
		for (int i = 0; i < 20; i++) {
			QuestionGenerator.next(GameQuestionService.BATCH_SIZE, random)
				.forEach(d -> assertThat(d.textEs()).doesNotContainPattern("(?i)\\b(vos|elegís|tenés|podés|querés|hacés|preferís)\\b"));
		}
	}
}
