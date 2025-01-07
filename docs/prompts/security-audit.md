## Prompts para Auditoría de Seguridad

Este conjunto de prompts está diseñado para identificar, evaluar y mejorar la seguridad en diferentes aspectos de la aplicación. Son útiles para mantener la integridad, confidencialidad y disponibilidad del sistema.

### Seguridad de Aplicación

Estos prompts se centran en la seguridad general de la aplicación.

#### Autenticación

```
Audita el sistema de autenticación actual. Verifica implementación de JWT, manejo de sesiones, protección contra ataques de fuerza bruta y políticas de contraseñas. Implementa mejores prácticas de seguridad en autenticación.
```

#### Autorización

```
Evalúa el sistema de autorización y control de acceso. Verifica roles, permisos, RBAC y protección de rutas. Implementa principio de menor privilegio y separación de responsabilidades.
```

#### Validación de Entrada

```
Audita la validación de entrada en [componente/API]. Implementa sanitización robusta, prevención de inyección y validación en cliente y servidor. Protege contra XSS, CSRF y otros ataques de entrada.
```

#### Manejo de Sesiones

```
Evalúa el manejo de sesiones de usuario. Verifica timeout, renovación segura, almacenamiento y destrucción de sesiones. Implementa protección contra hijacking y fijación de sesión.
```

#### Seguridad de API

```
Audita la seguridad de endpoints API. Implementa rate limiting, validación de tokens, CORS apropiado y protección contra ataques comunes. Asegura comunicación segura y autorizada.
```

#### Protección de Datos

```
Evalúa la protección de datos sensibles. Implementa encriptación en reposo y tránsito, manejo seguro de secretos y sanitización de logs. Cumple con regulaciones de privacidad.
```

#### Seguridad de Archivos

```
Audita el manejo de archivos y uploads. Implementa validación de tipos, escaneo de malware y almacenamiento seguro. Protege contra uploads maliciosos y ejecución de código.
```

#### Logging de Seguridad

```
Evalúa el sistema de logging de seguridad. Implementa registro de eventos de seguridad, alertas de actividad sospechosa y retención apropiada de logs. Facilita auditoría y forense.
```

### Seguridad de Infraestructura

Estos prompts se centran en la seguridad de la infraestructura.

#### Configuración Segura

```
Audita la configuración de seguridad del servidor. Verifica hardening del sistema, actualizaciones de seguridad y configuración de servicios. Implementa mejores prácticas de seguridad en infraestructura.
```

#### Network Security

```
Evalúa la seguridad de red. Implementa firewalls, segmentación de red y monitoreo de tráfico. Protege contra ataques de red y acceso no autorizado.
```

#### Database Security

```
Audita la seguridad de la base de datos SQLite. Verifica permisos, encriptación, backups seguros y protección contra inyección SQL. Implementa acceso seguro y monitoreo.
```

#### Secrets Management

```
Evalúa el manejo de secretos y credenciales. Implementa almacenamiento seguro, rotación de secretos y acceso controlado. Protege información sensible de configuración.
```

#### Backup Security

```
Audita la seguridad de backups. Verifica encriptación, almacenamiento seguro y procedimientos de restauración. Implementa protección contra pérdida y acceso no autorizado.
```

#### Monitoring Security

```
Evalúa el monitoreo de seguridad. Implementa detección de intrusiones, alertas de seguridad y respuesta a incidentes. Mantén visibilidad sobre amenazas de seguridad.
```

#### Service Security

```
Audita la seguridad de servicios y dependencias. Verifica versiones seguras, configuración apropiada y aislamiento de servicios. Protege contra vulnerabilidades conocidas.
```

#### Access Control

```
Evalúa el control de acceso a infraestructura. Implementa autenticación fuerte, logs de acceso y segregación de privilegios. Mantén control sobre acceso a recursos críticos.
```

### Seguridad de Código

Estos prompts se centran en la seguridad a nivel de código.

#### Code Review

```
Realiza revisión de seguridad del código en [módulo]. Busca vulnerabilidades comunes, malas prácticas y problemas de seguridad. Implementa correcciones siguiendo mejores prácticas.
```

#### Dependency Security

```
Audita la seguridad de dependencias. Verifica vulnerabilidades conocidas, actualiza versiones y evalúa impacto de seguridad. Mantén dependencias actualizadas y seguras.
```

#### Secure Coding

```
Evalúa prácticas de código seguro en [componente]. Implementa validación robusta, manejo seguro de errores y protección contra vulnerabilidades comunes. Sigue principios de secure coding.
```

#### Security Testing

```
Implementa pruebas de seguridad automatizadas. Configura SAST, DAST y pruebas de penetración. Integra seguridad en el pipeline de CI/CD.
```

#### Error Handling

```
Audita el manejo de errores y excepciones. Implementa logging seguro, mensajes de error apropiados y recuperación graceful. Evita exposición de información sensible.
```

#### Crypto Implementation

```
Evalúa implementaciones criptográficas. Verifica uso correcto de algoritmos, manejo de claves y funciones de hash. Implementa criptografía siguiendo estándares.
```

#### Security Headers

```
Audita headers de seguridad HTTP. Implementa CSP, HSTS y otros headers de seguridad. Protege contra ataques basados en browser.
```

#### Code Secrets

```
Evalúa secretos en el código. Implementa detección de secretos, prevención de commits sensibles y limpieza de historial. Protege contra exposición de credenciales.
```

### Compliance y Políticas

Estos prompts se centran en cumplimiento y políticas de seguridad.

#### Privacy Compliance

```
Audita cumplimiento de privacidad. Verifica GDPR, CCPA y otras regulaciones aplicables. Implementa controles de privacidad y documentación requerida.
```

#### Security Policies

```
Evalúa políticas de seguridad. Implementa políticas de acceso, uso aceptable y respuesta a incidentes. Mantén documentación actualizada y comunicada.
```

#### Data Classification

```
Implementa clasificación de datos. Identifica datos sensibles, aplica controles apropiados y documenta manejo de información. Asegura protección según sensibilidad.
```

#### Access Reviews

```
Realiza revisiones de acceso periódicas. Verifica permisos, revoca accesos innecesarios y mantén documentación de accesos. Implementa proceso de revisión regular.
```

#### Incident Response

```
Evalúa plan de respuesta a incidentes. Implementa procedimientos de detección, contención y recuperación. Mantén documentación y entrena al equipo.
```

#### Security Training

```
Implementa programa de entrenamiento en seguridad. Crea materiales, realiza sesiones y verifica comprensión. Mantén equipo actualizado en mejores prácticas.
```

#### Vendor Security

```
Audita seguridad de proveedores y terceros. Evalúa riesgos, verifica cumplimiento y establece requisitos de seguridad. Mantén control sobre riesgos externos.
```

#### Documentation

```
Evalúa documentación de seguridad. Mantén registros actualizados, procedimientos documentados y evidencia de controles. Facilita auditorías y cumplimiento.
```
