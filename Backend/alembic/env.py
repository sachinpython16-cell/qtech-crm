import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context, script

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Ensure project root is on sys.path so 'app' package is importable
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import your SQLAlchemy Base and models
from app.database import Base

# Import existing models to register them with Base.metadata
from app.models import (
    User,
    OutstandingToken,
    BlacklistToken,
    Company,
    ContactPerson,
    InquiryDeal,
    FollowUpRecord,
    InteractionLog,
)

# Set target metadata for 'autogenerate'
target_metadata = Base.metadata

# Get database URL from environment variable or settings
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    try:
        from app.config import settings

        DATABASE_URL = settings.DATABASE_URL
    except ImportError:
        raise Exception(
            "DATABASE_URL environment variable is not set and app.config is not available"
        )

config.set_main_option("sqlalchemy.url", DATABASE_URL)
masked_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "configured"
print(f"Using database: {masked_url}")


def process_revision_directives(context, revision, directives):
    """Hook to set sequential revision IDs (0001, 0002, 0003, etc.)"""
    script_dir = script.ScriptDirectory.from_config(config)
    head_revision = script_dir.get_current_head()

    if head_revision is None:
        new_rev_id = 1
    else:
        try:
            last_rev_id = int(head_revision.lstrip("0") or "0")
            new_rev_id = last_rev_id + 1
        except ValueError:
            revs = list(script_dir.walk_revisions())
            new_rev_id = len(revs) + 1

    new_rev_id_str = f"{new_rev_id:04d}"

    for directive in directives:
        directive.rev_id = new_rev_id_str


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
        render_as_batch=True,
        process_revision_directives=process_revision_directives,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            render_as_batch=True,
            process_revision_directives=process_revision_directives,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
