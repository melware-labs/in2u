package app.in2u.tips;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.in2u.user.CurrentUser;

@RestController
@RequestMapping("/api/tips")
class TipController {

	record TodayTip(String tipKey, String kicker, String advice, String source) {
	}

	private final TipService tips;

	private final CurrentUser currentUser;

	TipController(TipService tips, CurrentUser currentUser) {
		this.tips = tips;
		this.currentUser = currentUser;
	}

	/** El consejo de hoy para quien lee; vacío (204) si su pareja aún no hizo check-in. */
	@GetMapping("/today")
	org.springframework.http.ResponseEntity<TodayTip> today(@AuthenticationPrincipal OAuth2User principal) {
		return tips.todayFor(currentUser.of(principal))
			.map(t -> org.springframework.http.ResponseEntity
				.ok(new TodayTip(t.getTipKey(), t.getKickerText(), t.getAdviceText(), t.getSource())))
			.orElseGet(() -> org.springframework.http.ResponseEntity.noContent().build());
	}

	@GetMapping("/catalog")
	List<String> catalog() {
		return TipCatalog.ENTRIES.stream().map(TipCatalog.Entry::key).toList();
	}
}
