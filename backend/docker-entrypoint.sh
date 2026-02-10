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

# Import airport data (Always do this or check flag)
echo "📥 Importing airport data..."
npx tsx src/scripts/import-airports.ts || {
  echo "⚠️  Airport import failed, but continuing..."
}
echo "✅ Airport import completed"
echo ""

# Check if we should import flights
if [ "$AUTO_IMPORT_FLIGHTS" = "true" ]; then
  echo "📥 Auto-importing flights data..."
  
  # Check if airpaz flight data files exist (New logic)
  if [ -d "/app/data/airpaz_flight_data" ] && [ -n "$(ls -A /app/data/airpaz_flight_data/*.csv 2>/dev/null)" ]; then
    echo "   Found Airpaz flight data files, importing..."
    npx tsx src/scripts/import-airpaz-flights.ts --dir="/app/data/airpaz_flight_data" || {
      echo "⚠️  Airpaz flight import failed, but continuing..."
    }
    echo "✅ Airpaz flight import completed"
  # Fallback to old directory check (Legacy)
  elif [ -d "/app/data/flight_data" ] && [ -n "$(ls -A /app/data/flight_data/*.csv 2>/dev/null)" ]; then
    echo "   Found legacy flight data files, importing..."
    npx tsx src/scripts/import-flights-from-csv.ts || {
      echo "⚠️  Legacy flight import failed, but continuing..."
    }
    echo "✅ Legacy flight import completed"
  else
    echo "   No flight data files found, skipping import"
  fi
  # Check if international flight data files exist
  if [ -d "/app/data/intl_flight_data" ] && [ -n "$(ls -A /app/data/intl_flight_data/*.csv 2>/dev/null)" ]; then
    echo "   Found International flight data files, importing..."
    npx tsx src/scripts/import-intl-flights.ts --dir="/app/data/intl_flight_data" || {
      echo "⚠️  International flight import failed, but continuing..."
    }
    echo "✅ International flight import completed"
  fi

  echo ""
fi

# Start the server
echo "🌐 Starting server..."
exec node dist/server.js
