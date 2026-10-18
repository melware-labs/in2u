package app.in2u.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("in2u")
public record In2uProperties(String frontendUrl, boolean devLogin, Gemini gemini, Push push) {

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
}
