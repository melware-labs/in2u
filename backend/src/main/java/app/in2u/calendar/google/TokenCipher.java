package app.in2u.calendar.google;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import app.in2u.config.In2uProperties;

/**
 * Cifra los tokens de Google con AES-256-GCM antes de guardarlos. El resultado es
 * base64(iv de 12 bytes + texto cifrado con su etiqueta). La clave nunca va a la base.
 */
@Component
class TokenCipher {

	private static final int IV_BYTES = 12;

	private static final int TAG_BITS = 128;

	private final SecureRandom random = new SecureRandom();

	private final SecretKeySpec key;

	@Autowired
	TokenCipher(In2uProperties props) {
		this(props.googleCalendar() == null ? null : props.googleCalendar().tokenKey());
	}

	TokenCipher(String base64Key) {
		if (base64Key == null || base64Key.isBlank()) {
			this.key = null;
			return;
		}
		byte[] raw = Base64.getDecoder().decode(base64Key.trim());
		if (raw.length != 32) {
			throw new IllegalStateException("GOOGLE_TOKEN_KEY debe ser de 32 bytes en base64 (openssl rand -base64 32).");
		}
		this.key = new SecretKeySpec(raw, "AES");
	}

	String encrypt(String plain) {
		try {
			byte[] iv = new byte[IV_BYTES];
			random.nextBytes(iv);
			Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
			cipher.init(Cipher.ENCRYPT_MODE, requireKey(), new GCMParameterSpec(TAG_BITS, iv));
			byte[] sealed = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
			return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + sealed.length).put(iv).put(sealed).array());
		}
		catch (GeneralSecurityException e) {
			throw new IllegalStateException("No se pudo cifrar el token.", e);
		}
	}

	String decrypt(String encoded) {
		try {
			byte[] all = Base64.getDecoder().decode(encoded);
			Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
			cipher.init(Cipher.DECRYPT_MODE, requireKey(), new GCMParameterSpec(TAG_BITS, all, 0, IV_BYTES));
			return new String(cipher.doFinal(all, IV_BYTES, all.length - IV_BYTES), StandardCharsets.UTF_8);
		}
		catch (GeneralSecurityException e) {
			throw new IllegalStateException("No se pudo descifrar el token.", e);
		}
	}

	private SecretKeySpec requireKey() {
		if (key == null) {
			throw new IllegalStateException("Falta GOOGLE_TOKEN_KEY.");
		}
		return key;
	}
}
