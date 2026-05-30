# ── Build stage ───────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline -q
COPY backend/src ./src
RUN mvn clean package -DskipTests -q

# ── Runtime stage ─────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app
RUN groupadd -r cinema && useradd -r -g cinema cinema
COPY --from=build /app/target/*.jar app.jar
RUN chown cinema:cinema app.jar
USER cinema
EXPOSE 8080
ENV JAVA_OPTS="-XX:+UseSerialGC -Xss256k -Xmx220m -XX:MaxMetaspaceSize=128m -XX:CompressedClassSpaceSize=32m -XX:ReservedCodeCacheSize=32m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
