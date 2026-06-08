from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


UserRole = Literal["administrador", "funcionario", "usuario_general"]


class UserBase(BaseModel):
    mail: EmailStr
    pais_doc: str
    tipo_doc: str
    nro_doc: str
    pais_dir: str
    localidad: str
    calle: str
    nro_dir: str
    cod_postal: str


class PublicUserRegister(UserBase):
    model_config = ConfigDict(from_attributes=True)

    password: str
    role: UserRole = "usuario_general"
    telefonos: list[str] = Field(default_factory=list)
    verificado: bool = False


class AdminUserCreate(UserBase):
    model_config = ConfigDict(from_attributes=True)

    password: str
    telefonos: list[str] = Field(default_factory=list)
    id_sede: int | None = None
    nro_legajo: str | None = None


class UserUpdate(BaseModel):
    pais_doc: str | None = None
    tipo_doc: str | None = None
    nro_doc: str | None = None
    pais_dir: str | None = None
    localidad: str | None = None
    calle: str | None = None
    nro_dir: str | None = None
    cod_postal: str | None = None
    telefonos: list[str] | None = None
    verificado: bool | None = None


class UserProfile(UserBase):
    model_config = ConfigDict(from_attributes=True)

    role: UserRole
    telefonos: list[str] = Field(default_factory=list)
    fecha_registro: date | None = None
    verificado: bool = False
    fecha_asignacion: date | None = None
    id_sede: int | None = None
    nro_legajo: str | None = None