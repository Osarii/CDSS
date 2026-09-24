# Configuración de Serena MCP para Antigravity

Serena proporciona navegación semántica y edición precisa a nivel de símbolo para Antigravity a través del protocolo Model Context Protocol (MCP).

## Bloque de configuración MCP

Agrega la siguiente configuración en tu archivo `mcp_config.json` de Antigravity (ubicado en `~/.gemini/config/mcp_config.json` o en `.agents/mcp_config.json` en la raíz del proyecto):

```json
{
  "mcpServers": {
    "serena": {
      "command": "serena",
      "args": [
        "start-mcp-server",
        "--context=antigravity"
      ]
    }
  }
}
```

## Primer comando tras iniciar sesión

Una vez que Antigravity se conecte al servidor MCP de Serena, la primera instrucción recomendada es:

> **"Activate the current project using Serena's activation tool."**
