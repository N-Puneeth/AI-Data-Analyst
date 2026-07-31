import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# --- ADD THESE LINES ---
# Add the 'app' directory to the Python path so Alembic can find your modules
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.config import settings
from app.core.base import Base
# -----------------------

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- OVERRIDE THE DATABASE URL ---
config.set_main_option("sqlalchemy.url", settings.SQLALCHEMY_DATABASE_URI)

# --- SET TARGET METADATA ---
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    # ... (Keep existing offline code)
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    # ... (Keep existing online code)
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()