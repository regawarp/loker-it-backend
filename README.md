# How to Run

## Linux
```
npm install
DEBUG=loker-it-backend:* npm start
```

## Windows
```
npm install
set DEBUG=loker-it-backend:* & npm start
```

# Setup Database

```
PGPASSWORD=postgres psql -U postgres -a -f init.sql
```
