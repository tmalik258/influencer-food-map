from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.engine import Connection
from sqlalchemy.sql.schema import Table

from slugify import slugify


def ensure_unique_slug(
    connection: Connection,
    table: Table,
    slug_column: str,
    base_value: str,
    id_column: Optional[str] = 'id',
    current_id: Optional[object] = None,
    max_length: int = 255,
) -> str:
    """
    Ensure slug uniqueness within a table.

    Converts `base_value` to slug using python-slugify.
    If slug exists, append numeric suffixes (-2, -3, ...) until unique.
    Excludes the current row by `current_id` if provided.
    """
    base = slugify(base_value or '', max_length=max_length)
    if not base:
        base = 'untitled'

    conditions = [table.c[slug_column].like(f"{base}%")]
    if current_id is not None and id_column in table.c:
        conditions.append(table.c[id_column] != current_id)

    stmt = select(table.c[slug_column]).where(and_(*conditions))
    existing = set(connection.execute(stmt).scalars().all())

    if base not in existing:
        return base

    i = 2
    while True:
        suffix = f"-{i}"
        trunc_base = base[: max_length - len(suffix)]
        candidate = f"{trunc_base}{suffix}"
        if candidate not in existing:
            return candidate
        i += 1