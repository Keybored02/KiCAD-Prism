"""Settings for the supply module (distributor connectors).

`Settings` in `app.core.config` inherits this group, so supply settings are
added here without growing `config.py`.
"""
from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings


class SupplySettings(BaseSettings):
    SUPPLY_ENABLE_SIMULATED_PROVIDER: bool = Field(
        default=False,
        description="Allow connectors for the simulated distributor. For development, tests and demos only.",
    )

    SUPPLY_HTTPS_PROXY: str = Field(
        default="",
        description=(
            "HTTPS proxy for distributor calls, for example http://proxy.example.com:3128. "
            "Environment proxy variables are ignored on purpose. With a proxy set, the proxy resolves "
            "host names, so Prism checks the host against the allowlist but cannot check addresses itself."
        ),
    )

    SUPPLY_OAUTH_BASE_URL: str = Field(
        default="",
        description=(
            "Origin a distributor sign-in (DigiKey change notices) returns to, when it must differ from "
            "PUBLIC_BASE_URL, for example https://localhost while the app is registered with that address. "
            "Must be HTTPS. Empty uses PUBLIC_BASE_URL."
        ),
    )
