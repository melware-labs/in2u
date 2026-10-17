# Etapa 1: compila el jar con Maven (cachea dependencias antes de copiar el código).
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# Etapa 2: imagen mínima solo con el JRE.
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 in2u
COPY --from=build /app/target/in2u-backend-*.jar app.jar
USER in2u
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=40s \
  CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080 && printf "GET /actuator/health HTTP/1.0\r\n\r\n" >&3 && grep -q "\"UP\"" <&3'
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
