import asyncio
import smtplib
from email.message import EmailMessage
from typing import Any


class EmailService:
    def __init__(self, settings: dict[str, Any]):
        self.host = settings.get("smtpHost")
        self.port = int(settings.get("smtpPort") or 587)
        self.username = settings.get("smtpUsername")
        self.password = settings.get("smtpPassword")
        self.from_name = settings.get("smtpFromName") or "Mirabilis"
        self.from_email = settings.get("brandEmail") or self.username or "noreply@mirabilis.com"

    def is_configured(self) -> bool:
        return bool(self.host and self.password)

    def _send_sync(self, msg: EmailMessage) -> None:
        if not self.host:
            raise ValueError("SMTP host is not configured.")

        with smtplib.SMTP(self.host, self.port, timeout=10) as server:
            server.starttls()
            if self.username and self.password:
                server.login(self.username, self.password)
            server.send_message(msg)

    async def send_email(self, to_email: str, subject: str, body: str) -> None:
        if not self.is_configured():
            print(f"[Email Simulated] To: {to_email} | Subject: {subject}\n{body}")
            return

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.from_email}>"
        msg["To"] = to_email
        msg.set_content(body)

        await asyncio.to_thread(self._send_sync, msg)
