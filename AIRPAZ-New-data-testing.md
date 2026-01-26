## AIRPAZ New Data Testing

### in the frontend folder 

```bash 
cd frontend 
npm install --legacy-peer-deps
```

### in the backend folder 

```bash 
cd backend 
npm install
```

- create .env.test file 
- and copy the following 
```bash 
PORT=3101
NODE_ENV=development

DB_HOST=postgres
DB_PORT=5432
DB_NAME=flight_search_test
DB_USER=postgres
DB_PASSWORD=postgres

ENABLE_TIMESCALEDB=true
CORS_ORIGIN=http://localhost:3100
ENABLE_SCHEDULED_JOBS=false
AUTO_IMPORT_FLIGHTS=true
```

### in the root folder 

Add your openweathermap api key to the .env file 
create the .env file in the root folder first and copy the following: 
```bash 
NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_api_key
```

### Running the TEST Environment

From the root directory:
Run the following command: 
```bash 
docker compose -f docker-compose.test.yml up --build
``` 

But if you want it to be down 
```bash 
docker compose -f docker-compose.test.yml down
```

### Access URLs (TEST)

Frontend: http://localhost:3100

Backend API: http://localhost:3101/api/health 

Database:
Host: localhost
Port: 5434
DB Name: flight_search_test


### in the docker database 

in the exec termianl of flight_search_db_test on docker 
- psql -U postgres
- \c flight_search_test 
- \dt (to see all db tables)
- 

#### importing airpaz flight data 

Currently the flight data are automatically imported from the airpaz csv files when you run the docker compose -f docker-compose.test.yml up --build

but if you want to import the flight data manually
here is the detail on how: 
in the root folder 
```bash

docker exec -it flight_search_backend_test sh

/app $ npm run import:airpaz
```
...