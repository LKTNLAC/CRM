# Integration Contract

## Interface

### CommunicationProvider

```python
class CommunicationProvider(Protocol):
    name: str

    async def send(
        self,
        recipient: str,
        body: str,
        subject: str | None = None,
        meta: dict | None = None,
    ) -> SendResult: ...

    async def health_check(self) -> HealthStatus: ...
```
### PaymentProvider
```python
class PaymentProvider(Protocol):
    name: str

    async def create_intent(self, intent: dict) -> dict: ...
    async def verify_webhook(self, payload: bytes, signature: str) -> bool: ...
    async def refund(self, refund: dict) -> dict: ...
```
### StorageProvider
```python
class StorageProvider(Protocol):
    name: str

    async def presign_upload(self, key: str, ttl: int) -> str: ...
    async def presign_download(self, key: str, ttl: int) -> str: ...
```
### AIProvider
```python
class AIProvider(Protocol):
    name: str

    async def complete(self, prompt: str) -> str: ...
```
### Rules
1. Domain không biết provider. Chỉ biết interface.

2. Adapter inject qua registry/DI.

3. Mọi adapter có: config, validation, error handling, retry, timeout, logging, health check, documentation.

4. Không gọi provider trực tiếp từ domain/application.

### Providers
┌───────────────────────┬──────────────────────────────────────────────────────────────────────┐
| Interface             | Adapters                                                             |
├───────────────────────┼──────────────────────────────────────────────────────────────────────┤
| CommunicationProvider | EmailProvider, SMSProvider, ZaloProvider, PushProvider, MockProvider |
| PaymentProvider       | BankProvider, GatewayProvider, EWalletProvider                       |
| StorageProvider       | S3Provider, CloudStorageProvider                                     |
| AIProvider            | LLMProvider                                                          |
└───────────────────────┴──────────────────────────────────────────────────────────────────────┘
### Registry
```python
from app.integrations.registry import get_registry

registry = get_registry()
provider = registry.get_communication("EMAIL")
result = await provider.send(recipient, body)
```

### Config
Mỗi provider đọc config từ env:
┌───────────────┬────────────────────────────────────────────────┐
| Provider      | Env vars                                       |
├───────────────┼────────────────────────────────────────────────┤
| EmailProvider | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD |
| SMSProvider   | SMS_PROVIDER_KEY, SMS_API_URL                  |
| ZaloProvider  | ZALO_APP_ID, ZALO_APP_SECRET                   |
| PushProvider  | (FCM/APNs keys)                                |
└───────────────┴────────────────────────────────────────────────┘
Mỗi provider đọc config từ env:
┌───────────────┬────────────────────────────────────────────────┐
| Provider      | Env vars                                       |
├───────────────┼────────────────────────────────────────────────┤
| EmailProvider | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD |
| SMSProvider   | SMS_PROVIDER_KEY, SMS_API_URL                  |
| ZaloProvider  | ZALO_APP_ID, ZALO_APP_SECRET                   |
| PushProvider  | (FCM/APNs keys)                                |
└───────────────┴────────────────────────────────────────────────┘
Mỗi provider đọc config từ env:
┌───────────────┬────────────────────────────────────────────────┐
| Provider      | Env vars                                       |
├───────────────┼────────────────────────────────────────────────┤
| EmailProvider | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD |
| SMSProvider   | SMS_PROVIDER_KEY, SMS_API_URL                  |
| ZaloProvider  | ZALO_APP_ID, ZALO_APP_SECRET                   |
| PushProvider  | (FCM/APNs keys)                                |
└───────────────┴────────────────────────────────────────────────┘
Không hard-code credentials.

### Health 
GET /api/v1/integrations/health:
```json
{
  "channels": {
    "EMAIL": {"healthy": false, "detail": "SMTP_HOST not configured"},
    "SMS": {"healthy": false, "detail": "SMS_PROVIDER_KEY not configured"},
    "ZALO": {"healthy": false, "detail": "ZALO_APP_ID not configured"},
    "PUSH": {"healthy": false, "detail": "Push provider not implemented"},
    "MOCK": {"healthy": true, "detail": "mock provider always healthy"}
  }
}
```
### Error Handling
Mỗi adapter phải:

Return SendResult(success=False, error="...") khi fail.

Log lỗi với structured logging.

Có timeout (mặc định 15s).

Retry (Celery worker).



┌───────────────┬────────────────────────────┐

├───────────────┼────────────────────────────┤

└───────────────┴────────────────────────────┘