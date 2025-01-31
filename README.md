
### test commands

```bash
docker-compose up -d
npm run test
```

### other commands

PM2
```bash
# Install PM2 for process management
npm install pm2 -g

# Start application in production
pm2 start app.js --name spenza-be

# Start and Daemonize any application:
pm2 start app.js

# Load Balance 4 instances of api.js:
pm2 start api.js -i 4

# Monitor in production:
pm2 monitor

# Make pm2 auto-boot at server restart:
pm2 startup
```

docker
```bash
docker build -t webhook-server .
docker run -d -p 3000:3000 --name webhook-server webhook-server
```

docker-compose
```bash
docker-compose up -d
docker-compose down
```
