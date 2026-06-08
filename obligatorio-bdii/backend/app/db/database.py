from __future__ import annotations

from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path
from typing import Any, AsyncIterator

import aiomysql
from dotenv import load_dotenv
from aiomysql.cursors import DictCursor

from app.core.config import get_settings

logger = logging.getLogger(__name__)
_pool: aiomysql.Pool | None = None


def _load_environment_file() -> str:
	app_env = os.getenv("APP_ENV", "local").strip() or "local"
	project_root = Path(__file__).resolve().parents[3]
	environment_file = project_root / f".env.{app_env}"

	if environment_file.exists():
		load_dotenv(environment_file, override=True)
	else:
		logger.warning("Environment file not found for APP_ENV=%s: %s", app_env, environment_file)

	return app_env


async def init_pool() -> aiomysql.Pool:
	global _pool

	if _pool is None:
		app_env = _load_environment_file()
		settings = get_settings()
		try:
			_pool = await aiomysql.create_pool(
				host=settings.mysql_host,
				port=settings.mysql_port,
				user=settings.mysql_user,
				password=settings.mysql_password,
				db=settings.mysql_database,
				minsize=settings.mysql_pool_min_size,
				maxsize=settings.mysql_pool_max_size,
				autocommit=False,
				charset=settings.mysql_charset,
			)
		except Exception:
			logger.exception("Unable to connect to MySQL using APP_ENV=%s", app_env)
			raise

	return _pool


async def close_pool() -> None:
	global _pool

	if _pool is not None:
		_pool.close()
		await _pool.wait_closed()
		_pool = None


async def get_pool() -> aiomysql.Pool:
	return await init_pool()


@asynccontextmanager
async def acquire_connection() -> AsyncIterator[aiomysql.Connection]:
	pool = await get_pool()
	connection = await pool.acquire()
	try:
		yield connection
	finally:
		pool.release(connection)


@asynccontextmanager
async def transaction() -> AsyncIterator[aiomysql.Connection]:
	async with acquire_connection() as connection:
		try:
			await connection.begin()
			yield connection
			await connection.commit()
		except Exception:
			await connection.rollback()
			raise


async def fetch_one(query: str, params: tuple[Any, ...] | list[Any] | None = None) -> dict[str, Any] | None:
	async with acquire_connection() as connection:
		async with connection.cursor(DictCursor) as cursor:
			await cursor.execute(query, params or ())
			return await cursor.fetchone()


async def fetch_all(query: str, params: tuple[Any, ...] | list[Any] | None = None) -> list[dict[str, Any]]:
	async with acquire_connection() as connection:
		async with connection.cursor(DictCursor) as cursor:
			await cursor.execute(query, params or ())
			rows = await cursor.fetchall()
			return list(rows)


async def execute(query: str, params: tuple[Any, ...] | list[Any] | None = None) -> int:
	async with acquire_connection() as connection:
		async with connection.cursor() as cursor:
			await cursor.execute(query, params or ())
			await connection.commit()
			return cursor.lastrowid or cursor.rowcount
