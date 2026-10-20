# MascoTimes

Newsletter automatizada sobre mascotas.

- `web`: web pública (nginx, de momento una página placeholder)
- `n8n`: automatizaciones (con Claude vía credenciales de Anthropic dentro de n8n)

Variables de entorno que se configuran en Dokploy (nunca en el repo, es público):

- `N8N_HOST`: dominio de n8n, por ejemplo n8n.ivotsweb.com
- `N8N_ENCRYPTION_KEY`: clave larga aleatoria, no cambiarla una vez creada
