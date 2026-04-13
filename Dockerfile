FROM gradle:8.10.2-jdk21 AS builder

WORKDIR /app

COPY . .

RUN chmod -x gradlew
RUN ./gradlew buildFatJar -x test --noe-daemon

FROM eclipse-temurin:21-jre

COPY --from=builder /app/build/libs/*-all.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]