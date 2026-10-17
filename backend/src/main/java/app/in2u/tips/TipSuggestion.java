package app.in2u.tips;

/** Resultado de elegir un consejo: qué consejo, por qué hoy y qué hacer. */
public record TipSuggestion(String tipKey, String kicker, String advice, String source) {
}
