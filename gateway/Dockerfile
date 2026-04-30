FROM maven:3.9.12-eclipse-temurin-25-alpine AS build
WORKDIR /workspace

COPY pom.xml ./
RUN mvn -B -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

ENV JAVA_OPTS=""

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=build --chown=spring:spring /workspace/target/gateway-0.0.1-SNAPSHOT.jar ./app.jar

# Render injects $PORT at runtime — do NOT hardcode 8081
USER spring

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8081} -jar /app/app.jar"]
