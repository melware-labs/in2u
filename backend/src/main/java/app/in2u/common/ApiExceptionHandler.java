package app.in2u.common;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Los errores de la API llevan siempre {"message": "..."} para que el
 * frontend muestre el texto tal cual, sin depender de cómo Spring arme la
 * página de error por defecto (que omite el mensaje).
 */
@RestControllerAdvice
class ApiExceptionHandler {

	@ExceptionHandler(ResponseStatusException.class)
	ResponseEntity<Map<String, String>> status(ResponseStatusException e) {
		return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason() == null ? "" : e.getReason()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<Map<String, String>> invalid(MethodArgumentNotValidException e) {
		return ResponseEntity.badRequest().body(Map.of("message", "Datos inválidos."));
	}
}
