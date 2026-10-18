# Panel i przegląd odporności — 2026-10-10

## Interfejs

Przebudowano wszystkie 10 stron na lokalnym Bootstrapie 5.3.8. Wspólny układ ma boczną nawigację, zwijane menu mobilne, jasny/ciemny motyw, formularze i tabele. Usunięto zależność od fontów Google, fikcyjny wybór opcjonalnych cookies i nieczynne przyciski demonstracyjne administratora. Zachowano ustawienia dostępności.

## Znalezione i poprawione problemy

| Obszar | Problem | Zmiana |
| --- | --- | --- |
| Start aplikacji | Hasło bazy trafiało do logów; znane hasło administratora było przywracane przy każdym starcie. | Usunięte logowanie sekretów. Opcjonalny administrator z konfiguracji tworzony jest tylko, gdy konto nie istnieje. |
| Sesje | Błędny JWT odświeżania powodował 500. Bcrypt porównywał tylko początek długiego tokenu. | Rozdzielone typy JWT, unikalne refresh tokeny, SHA-256 całego tokenu, odpowiedź 401. |
| Uprawnienia | Usunięte konto lub obniżona rola pozostawały skuteczne w starym access tokenie. | HTTP czyta bieżącą rolę z bazy. WebSocket sprawdza ją przed zapisem i okresowo co najwyżej co 30 sekund; zamyka połączenie po wygaśnięciu JWT. |
| Wylogowanie | Usuwano jedynie token w przeglądarce. | Endpoint `/auth/logout` unieważnia konkretny refresh token. Zmiana hasła usuwa sesje odnawiania konta. |
| Agregacja | Równoczesny pierwszy zapis mógł naruszyć klucz unikalny; aktualizacje gubiły próbki. | Blokada rekordu transformatora w transakcji, poprawne liczenie statystyk. |
| Klucze pomiarowe | `DISTINCT` obejmował całe wiersze, więc lista kluczy powtarzała nazwy. | Wybierana jest tylko kolumna klucza. |
| Usuwanie | Baza tworzona przez aplikację nie miała wszystkich kaskad z pliku SQL. | Jawne usuwanie dzieci w jednej transakcji, blokady rodziców przy tworzeniu i kasowaniu. |
| Walidacja | Za długie pola, nierealne ustawienia Modbus i błędne daty dochodziły do bazy. | Limity zgodne z kolumnami, skończone liczby, zakresy portu/rejestrów i dat, 400/409 zamiast przypadkowego 500. |
| WebSocket | Wolny klient blokował rozsyłanie, odłączenia mogły zgubić subskrypcję, błędne wiadomości były ignorowane. | Atomowa rejestracja, kolejka 64 wiadomości na odbiorcę, timeout wysyłania, jawne błędy JSON, sprzątanie sesji. |
| HTTP → WebSocket | Pomiary zapisane przez HTTP nie pojawiały się na żywo. | Obie ścieżki rozsyłają zapisany agregat. |
| Panel na żywo | Brak reconnect, wyścigi zmiany transformatora, wielokrotne punkty tej samej minuty, błędna strefa czasu. | Reconnect z narastającym opóźnieniem, kontrola generacji połączenia, scalanie po czasie agregatu, UTC z `Z`. |
| JavaScript | Współdzielone skrypty deklarowały globalne `STORAGE` i funkcje o tych samych nazwach. | Izolacja modułu stanu; test sprawdza łączną kompilację skryptów każdej strony. |
| HTML | Dane urządzeń i komunikaty błędów trafiały bezpośrednio do `innerHTML`. | Escapowanie dynamicznych wartości. |
| Żądania panelu | Odnowienia sesji ścigały się, żądania mogły wisieć, błędy wyglądały jak zerowe wyniki. | Wspólna obietnica odnowienia, 15-sekundowy timeout, rozróżnienie awarii i braku danych. |
| Dystrybucja | Docker kopiował wildcardem potencjalnie kilka różnych JAR-ów. | Jawny `app-all.jar`, budowany przez `buildFatJar`, oraz testy w obrazie budującym. |

## Weryfikacja

12 testów Kotlin/Ktor korzysta z osobnej bazy H2 w trybie MySQL; nie używają `.env` ani produkcyjnej bazy. Sprawdzają HTTP, rzeczywiste sesje WebSocket klient–serwer w środowisku testowym, uprawnienia, walidację, agregację 40 równoczesnych zapisów, kolejki odbiorców i kasowanie powiązań. Wszystkie 12 testów oraz 6 testów JavaScript przeszło; zbudowano `app-all.jar`.

```sh
./gradlew test buildFatJar --no-daemon
node src/test/js/frontend.test.cjs
```

Testy JavaScript obejmują wszystkie zestawy skryptów stron, równoczesne 401, spóźnione odnowienie po wylogowaniu, awarie sieci, timeout zapisu i escapowanie HTML. Dodatkowo panel sprawdzany jest w Chromium na szerokościach 1440 i 390 px, na odizolowanym serwerze: rejestracja, utworzenie transformatora, odczyty, reconnect, komunikaty zawierające HTML i menu mobilne.

## Zmiany wymagające uwagi przy wdrożeniu

- Po aktualizacji trzeba zalogować się ponownie. Stare tokeny nie mają rozróżnienia `type`, a stare hashe sesji nie są zgodne z pełnym SHA-256.
- Automatyczny reset hasła konta `admin@admin` został usunięty. Istniejące konto nie jest zmieniane. Jeśli nadal ma fabryczne hasło z poprzedniej wersji, należy je zmienić.
- Nową pustą bazę można zainicjalizować kontem administratora przez `BOOTSTRAP_ADMIN_EMAIL` i `BOOTSTRAP_ADMIN_PASSWORD` (minimum 8 znaków, maksimum 72 bajty UTF-8). Po utworzeniu konta usuń te ustawienia. Nie zmieniają roli ani hasła już istniejącego konta.
- Domyślnie API obsługuje ten sam origin co panel. Dla osobnego frontendu ustaw `CORS_ORIGINS`, np. `https://panel.example.com,http://localhost:3000`.
- Daty pomiarów w odpowiedziach mają teraz jawny sufiks `Z` (UTC). Kluczem pomiaru używanym przez obecny panel jest nazwa rejestru. Nazwy powinny być unikalne w obrębie transformatora.
- Przeglądarka uwierzytelnia WebSocket pierwszą wiadomością `{"type":"auth","token":"ACCESS_TOKEN"}`; ma na to 5 sekund. Klient otrzymuje `{"type":"ready"}`. Klient urządzenia może nadal używać nagłówka `Authorization: Bearer …` albo parametru `token`; powinien ignorować wiadomości sterujące `type`.
- Maksymalna ramka WebSocket wynosi 64 KiB. Przekroczenie kolejki lub timeout oznacza konieczność reconnect i ponownego pobrania historii przez HTTP.

## Granice przeglądu

To nie jest gwarancja braku awarii. Nie wykonano testów na fizycznych urządzeniach, docelowym MySQL, docelowym reverse proxy ani długiego testu obciążenia. H2 nie odwzorowuje wszystkich zachowań InnoDB; przed wdrożeniem trzeba sprawdzić migrację i równoczesne zapisy na kopii docelowej bazy.

Pozostałe ograniczenia: automatyczne modyfikowanie schematu przez Exposed zamiast wersjonowanych migracji; brak limitów logowania/połączeń per klient i paginacji dużych list; broadcast działa wewnątrz jednego procesu (wiele replik wymaga wspólnego brokera); otwarta rejestracja jest zachowana. Access token pozostaje ważny maksymalnie 15 minut po wylogowaniu lub zmianie hasła, choć dalsze odnawianie sesji jest unieważnione. Wylogowanie offline czyści dane lokalne, ale nie może odwołać sesji na niedostępnym serwerze. Ponowienie przez urządzenie zapisu po utraconym potwierdzeniu może policzyć próbkę drugi raz — protokół nie posiada identyfikatora próbki.

Dokumentacja użyta przy zmianach: [Bootstrap](https://getbootstrap.com/docs/5.3/), [Ktor WebSockets](https://ktor.io/docs/server-websockets.html), [Exposed transactions](https://www.jetbrains.com/help/exposed/transactions.html).
