package app.in2u.calendar.google;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface GoogleCalendarLinkRepository extends JpaRepository<GoogleCalendarLink, UUID> {
}
