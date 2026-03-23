FROM ubuntu:latest
LABEL authors="firkowski"

# 1) ETAP: build (tu jest Gradle + JDK)
FROM gradle:8.7-jdk21 AS build
WORKDIR /app

# 2) Kopiujemy pliki Gradle jako pierwsze, żeby cache działał
COPY build.gradle.kts settings.gradle.kts gradle.properties* ./
COPY gradle ./gradle
COPY gradlew ./gradlew

# 3) Pobierz zależności (warstwa cache) – przyspiesza kolejne buildy
RUN ./gradlew dependencies --no-daemon || true

# 4) Dopiero teraz cały kod projektu
COPY . .

# 5) Budujemy JAR do obrazu runtime; testy odpalaj osobno (CI/lokalnie z DB)
RUN ./gradlew clean build -x test --no-daemon

# 6) ETAP: runtime (tu nie ma Gradle, tylko JRE)
FROM eclipse-temurin:21-jre
WORKDIR /app

# 7) Kopiujemy gotowy JAR z etapu build do runtime
COPY --from=build /app/build/libs/*.jar /app/app.jar

# 8) Ktor domyślnie często leci na 8080
EXPOSE 8080
ENV PORT=8080

# 9) Start aplikacji
CMD ["java", "-jar", "/app/app.jar"]
