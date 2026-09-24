# Required Data Gate

## Invariante de Seguridad Clínica Obligatoria
En CDSS-CR rige la siguiente regla clínica invariable:
- **UNKNOWN !== NORMAL**
- **MISSING !== NORMAL**
- **UNAVAILABLE !== NORMAL**
- **STALE !== NORMAL**

La ausencia o retraso de información diagnóstica o analítica nunca debe interpretarse implícitamente como un resultado negativo o normal. Si falta la creatinina sérica, el aclaramiento renal o la confirmación de alergias, el sistema CDSS-CR debe marcar el contexto como incompleto y activar las alertas de datos faltantes correspondientes.

## Estados de Disponibilidad
- `AVAILABLE`: El dato clínico está presente, estructurado y dentro del intervalo de validez temporal aceptado.
- `MISSING`: El dato debió registrarse en el encuentro clínico pero no existe en el registro sintético.
- `UNKNOWN`: La variable fue consultada pero el estado es desconocido o no determinado.
- `STALE`: El dato existe pero ha superado la ventana máxima de vigencia clínica permitida para la regla.
- `UNAVAILABLE`: El repositorio de datos o adaptador no pudo recuperar el valor por indisponibilidad del servicio.
