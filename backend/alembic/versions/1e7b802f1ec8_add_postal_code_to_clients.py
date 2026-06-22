"""Add postal_code to clients

Revision ID: 1e7b802f1ec8
Revises: ade3a65ef2c0
Create Date: 2026-06-22 17:54:49.941031

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e7b802f1ec8'
down_revision: Union[str, Sequence[str], None] = 'ade3a65ef2c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('clients', sa.Column('postal_code', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('clients', 'postal_code')
