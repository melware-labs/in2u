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
}
