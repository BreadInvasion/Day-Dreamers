import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_url: str = ""
    pass_key: str = ""
    is_ipv6: bool = False

    model_config: SettingsConfigDict = SettingsConfigDict(env_file=".env")


settings = Settings()
