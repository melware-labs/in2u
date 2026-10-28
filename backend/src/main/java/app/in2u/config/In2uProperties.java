package app.in2u.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("in2u")
public record In2uProperties(String frontendUrl, boolean devLogin, Gemini gemini, Push push,
		GoogleCalendar googleCalendar) {

	public record Gemini(String apiKey, String model, boolean sendNotes) {

		public boolean configured() {
			return apiKey != null && !apiKey.isBlank();
		}
	}

	public record Push(String publicKey, String privateKey, String subject) {

		public boolean configured() {
			return publicKey != null && !publicKey.isBlank() && privateKey != null && !privateKey.isBlank();
		}
	}

	/**
	 * Vinculación con Google Calendar. Usa el mismo cliente OAuth que el inicio de sesión,
	 * pero pide el permiso del calendario aparte y solo a quien toca "Vincular".
	 */
	public record GoogleCalendar(String clientId, String clientSecret, String redirectUri, String tokenKey) {

		public boolean configured() {
			return tokenKey != null && !tokenKey.isBlank() && clientId != null && !clientId.isBlank()
					&& !clientId.equals("sin-configurar");
		}
	}
}
