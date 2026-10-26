# MascoTimes

Newsletter automatizada sobre mascotas.

- `web`: web pública (nginx). Carpeta `web/`: portada y sección /noticias, que lee las noticias aprobadas desde la API pública de n8n
- `n8n`: automatizaciones (con Claude vía credenciales de Anthropic dentro de n8n)

Variables de entorno que se configuran en Dokploy (nunca en el repo, es público):

- `N8N_HOST`: dominio de n8n, por ejemplo n8n.ivotsweb.com
- `N8N_ENCRYPTION_KEY`: clave larga aleatoria, no cambiarla una vez creada
- `SANDBOX_API_KEY`, `SANDBOX_REGISTRATION_TOKEN`, `SANDBOX_RUNNER_KEY`: secretos del sandbox de n8n Assistant (valores aleatorios distintos)
