# ── Build stage ───────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Runtime stage ─────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app
RUN groupadd -r cinema && useradd -r -g cinema cinema
COPY --from=build /app/target/*.jar app.jar
RUN chown cinema:cinema app.jar
USER cinema
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
