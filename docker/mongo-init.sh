#!/bin/bash
# =============================================================================
# MongoDB Initialization Script
# =============================================================================
# This script runs when the MongoDB container is first initialized.
# It creates an application user with read/write access to the tourism database.
# Environment variables are passed from docker-compose.yml
# =============================================================================

set -e

echo "Starting MongoDB initialization..."
echo "Database: $MONGO_DATABASE"
echo "App User: $MONGO_APP_USER"

mongosh <<EOF
// Switch to the application database
db = db.getSiblingDB('$MONGO_DATABASE');

// Create application user with readWrite role
db.createUser({
    user: '$MONGO_APP_USER',
    pwd: '$MONGO_APP_PASSWORD',
    roles: [
        {
            role: 'readWrite',
            db: '$MONGO_DATABASE'
        }
    ]
});

print('MongoDB initialization completed successfully');
print('Database: $MONGO_DATABASE');
print('User: $MONGO_APP_USER created with readWrite access');
EOF

echo "MongoDB initialization script finished."
