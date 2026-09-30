# Análisis técnico: Visa Agentic Commerce

Fuente: los 4 PDFs de `docs/` (30-sep-2026). Todos son *Visa Confidential*: no se deben redistribuir fuera de Jelou.

## Resumen

Visa ofrece tres caminos. Difieren mucho en esfuerzo y en alcance PCI:

| Camino | Qué es | Esfuerzo | PCI para Jelou | Estado |
|---|---|---|---|---|
| **Agentic Assist** (B2BA ProxyPay API) | REST simple: Visa paga en el portal del proveedor con automatización de navegador | Bajo | **Alto**: se envían PAN y CVV en el body | En desarrollo; solo URL de QA |
| **ICC** (Intelligent Commerce Connect) | Capa de conexión: tokens, passkeys, mandatos y credenciales de pago | Medio | Bajo si se usa Flex Microform (iframes de Visa) | Sandbox disponible |
| **VIC + TAP** directo | Integración completa con VTS, VPP y TAP | Alto | Alto: PCI DSS, mTLS y certificación | VIC y VTS en certificación y producción; TAP en sandbox y producción |

La regla de decisión de Visa: **empezar con ICC** salvo que ya se use VGS o Basis Theory.

## 1. Agentic Assist (B2BA ProxyPay API)

Es un wrapper REST sobre el *ProxyPay MCP Server*. El pago lo ejecuta un **agente de navegador** que llena el formulario del portal de pagos del proveedor.

- **Auth:** headers `x-api-key` y `X-Client-ID` en todas las rutas `/v1/*`.
- **Base URL:** solo QA (`b2ba-proxy-pay-api-qa...trusted.visa.com`).
- **Flujo en dos pasos:**
  1. `POST /v1/payments` con solo `supplierName`. Devuelve **400 a propósito**, con `status: information_required` y `requiredFields` (nombre, tipo y regex de validación).
  2. `POST /v1/payments` con `fields` completos. Devuelve `correlationId` y `PAYMENT_INITIATED`.
  3. Polling a `GET /v1/payments/:correlationId` hasta `COMPLETED` o `FAILED`. Al completar trae los `outputFields` pedidos (ej. `transactionId`, `confirmationNumber`).
- **Errores:** RFC 7807 (`application/problem+json`). 503 si el MCP interno no responde.

**Encaje con Jelou:** es muy natural para un flujo conversacional. `requiredFields` se puede mapear a preguntas dinámicas en WhatsApp. Es directamente el caso "pago a proveedores" del deck.

**Riesgos:**
- En el paso 2 se envían `card-number`, `cvv` y `expiry-date` en claro. Si Jelou los recibe por WhatsApp o los guarda, entra en **alcance PCI DSS completo**. Hay que preguntar si acepta un token o credencial de VTS en lugar del PAN.
- Depende de automatizar portales de terceros: es frágil y lento, de ahí el polling.
- El producto está "en desarrollo" y sujeto a cambios.
- La documentación tiene inconsistencias: la tabla de códigos de error está desalineada, y `/health` siempre responde 200 aunque el MCP esté caído, así que no sirve para monitorear.

## 2. ICC (Intelligent Commerce Connect)

Es la puerta recomendada para implementaciones **no PCI**. Tiene seis pasos: sandbox, llaves MLE, passkeys, captura de tarjeta, pruebas y producción.

- **Sandbox:** registro en `developer.visaacceptance.com/hello-world/agentic-sandbox.html`. El *Organization ID* no se puede cambiar: hay que elegirlo bien.
- **Seguridad:** certificados MLE de request y response (JWE cifra, JWS autentica), generados en el Business Center de prueba.
- **Passkeys (VTS / VPP):**
  - Tarjeta nueva: tokenizar, crear sesión VTS, OTP si se pide y registrar la passkey. Se guardan `fidoBlob`, `rpID` e `identifier`.
  - Tarjeta existente: sesión VTS, prompt biométrico y `AUTH_COMPLETE`.
- **Captura de tarjeta:** Flex Microform, iframes alojados por Visa. El dato sensible nunca pasa por los servidores de Jelou.
- **APIs** (`/acp/v1`):
  1. `POST /tokens`: enrolar la tarjeta tokenizada con `assuranceData`.
  2. `POST /instructions`: crear el mandato de compra con `declineThreshold` (monto máximo) y `effectiveUntilTime`. Devuelve `instructionId`.
  3. `POST /instructions/{id}`: actualizar el mandato.
  4. `POST /instructions/{id}/cancel`: cancelar.
  5. `POST /instructions/{id}/credentials`: obtener DPAN y criptograma.
  6. `POST /instructions/{id}/confirmations`: reportar `APPROVED`, `DECLINED` o `FAILED`.

**Encaje con Jelou:**
- Los mandatos con límite y vigencia son justo los "controles, límites y autorizaciones" que menciona Visa para gastos corporativos.
- El iframe de VTS y el prompt biométrico no corren dentro de WhatsApp. Requieren un **webview**, que se puede servir con Jelou Sites.

**Punto crítico:** el paso 5 entrega un DPAN y un criptograma para **enviarlos a "tu procesador"**. ICC no procesa el pago: Jelou o el comercio necesitan un adquirente o procesador que acepte network tokens.

## 3. VIC + TAP directo

Es el camino más pesado:
- BID y TRID (identificadores de Visa).
- Proyecto en VDC (Visa Developer Center).
- mTLS con CSR y cifrado a nivel de campo.
- PCI DSS y plan de certificación de Visa.
- Acceso restringido que se pide por el representante de Visa.

Visa estima **unos 10 días hábiles por etapa** solo en configurar ambientes.

**TAP** (Trusted Agent Protocol) registra y verifica al agente detrás de cada request. Sus claves públicas se publican en VARS, y hay repo público en `github.com/visa/trusted-agent-protocol`.

Hoy no tiene sentido como primer paso. Queda para después de un piloto con ICC.

## Propuesta de respuesta a los 3 puntos de Visa

### 1. Modelo de integración

**ICC** como base. Jelou actúa como *Agent Provider*: es dueño de la experiencia conversacional. Evita el alcance PCI con Flex Microform y resuelve la autenticación con passkeys en un webview. En paralelo se puede evaluar **Agentic Assist** para pagos a proveedores, siempre que acepte credenciales tokenizadas.

### 2. APIs prioritarias

- **ICC:** `tokens`, `instructions` (crear y cancelar), `credentials` y `confirmations`. Además, el registro y la autenticación con VPP.
- **Agentic Assist:** `POST /v1/payments` (descubrir campos y ejecutar) y `GET /v1/payments/:id`.

### 3. Casos de uso para el piloto

1. **Pago a proveedores por WhatsApp.** Llega la factura, el agente la valida, pide aprobación al responsable y paga. Coincide con el caso 2 del deck y con Agentic Assist.
2. **Gastos corporativos con mandato.** El administrador define un límite y una vigencia con `declineThreshold` y `effectiveUntilTime`. El empleado compra desde WhatsApp dentro de ese marco. Coincide con el caso 1 del deck (viajes).

## Preguntas abiertas para Visa

1. ¿Agentic Assist acepta un token de VTS en lugar de PAN y CVV?
2. ¿Cuándo hay URL de producción de Agentic Assist? ¿Qué SLA y qué latencia típica tiene hasta `COMPLETED`?
3. En ICC, ¿qué procesador usamos para el DPAN y el criptograma? ¿Visa Acceptance (Cybersource) lo cubre?
4. ¿Qué disponibilidad hay en LatAm? Todos los ejemplos están en USD y con país US. ¿Qué monedas y países aplican al piloto?
5. ¿Jelou entra como *Agent Provider* o como *Agent Enabler* (TR-TSP)? Esto cambia quién onboardea a los clientes finales.
6. ¿Cuál es el tarifario? El documento dice "a definir".
7. ¿El flujo de passkeys se puede completar en el webview in-app de WhatsApp? Hay que confirmarlo sobre todo en iOS.
