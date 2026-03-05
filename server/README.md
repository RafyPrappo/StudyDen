# StudyDen Backend

Express.js backend for StudyDen.

## Run

```bash
npm install
npm run dev
```

Server:

```
http://localhost:5000
```

Health endpoint:

```
GET /api/health
```

## Structure (MVC)

```
src/
  config/
  models/
  controllers/
  routes/
  middlewares/
  services/
  utils/
```

## Next Step

Implement authentication:

* User model
* JWT auth
* Register/Login routes
* Auth middleware
