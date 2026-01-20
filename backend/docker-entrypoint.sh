#!/bin/sh
set -e

echo "🚀 Starting Flight Search Backend..."
echo ""

# Wait for database to be ready
echo "⏳ Waiting for database  to be ready..."
max_attempts=30
attempt=0
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "❌ Database is not ready after $max_attempts attempts"
    exit 1
  fi
  echo "   Database is unavailable - sleeping... (attempt $attempt/$max_attempts)"
  sleep 2
done

echo "✅ Database is ready!"
echo ""

# Run migrations using tsx (since we need to run TypeScript files)
echo "🔄 Running database migrations..."
npx tsx src/database/migrate.ts || {
  echo "⚠️  Migration failed, but continuing..."
}

echo "✅ Migrations completed"
echo ""

# Check if we should import flights
if [ "$AUTO_IMPORT_FLIGHTS" = "true" ]; then
  echo "📥 Auto-importing flights data..."
  
  # Check if flight data files exist
  if [ -d "/app/data/flight_data" ] && [ -n "$(ls -A /app/data/flight_data/*.csv 2>/dev/null)" ]; then
    echo "   Found flight data files, importing..."
    npx tsx src/scripts/import-flights-from-csv.ts || {
      echo "⚠️  Flight import failed, but continuing..."
    }
    echo "✅ Flight import completed"
  else
    echo "   No flight data files found, skipping import"
  fi
  echo ""
fi

# Start the server
echo "🌐 Starting server..."
exec node dist/server.js
