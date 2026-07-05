import os

# Redirect database connection to test-specific SQLite file
os.environ["DATABASE_URL"] = "test_crypto_advisor.db"
