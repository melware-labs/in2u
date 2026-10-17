package app.in2u.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("in2u")
public record In2uProperties(String frontendUrl, boolean devLogin, Gemini gemini) {

	public record Gemini(String apiKey, String model, boolean sendNotes) {

		public boolean configured() {
			return apiKey != null && !apiKey.isBlank();
		}
	}
}
