"""remove_merchant_id_from_transactions

Revision ID: 11535245c0d2
Revises: c33b226187eb
Create Date: 2026-04-03 09:42:41.955658

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '11535245c0d2'
down_revision = 'c33b226187eb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop merchant_id from transactions table
    op.drop_index('ix_transactions_merchant_id', table_name='transactions')
    op.drop_constraint('transactions_merchant_id_fkey', 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'merchant_id')
    
    # Drop merchant_id from recurring_transactions table
    op.drop_index('ix_recurring_transactions_merchant_id', table_name='recurring_transactions')
    op.drop_constraint('recurring_transactions_merchant_id_fkey', 'recurring_transactions', type_='foreignkey')
    op.drop_column('recurring_transactions', 'merchant_id')


def downgrade() -> None:
    # Re-add merchant_id to recurring_transactions table
    op.add_column('recurring_transactions', sa.Column('merchant_id', sa.Integer(), nullable=True))
    op.create_foreign_key('recurring_transactions_merchant_id_fkey', 'recurring_transactions', 'merchants', ['merchant_id'], ['id'])
    op.create_index('ix_recurring_transactions_merchant_id', 'recurring_transactions', ['merchant_id'])
    
    # Re-add merchant_id to transactions table
    op.add_column('transactions', sa.Column('merchant_id', sa.Integer(), nullable=True))
    op.create_foreign_key('transactions_merchant_id_fkey', 'transactions', 'merchants', ['merchant_id'], ['id'])
    op.create_index('ix_transactions_merchant_id', 'transactions', ['merchant_id'])
