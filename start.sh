#!/bin/bash
docker-compose up -d
sleep 5
curl localhost:4040/api/tunnels | grep -o "https://.*\.ngrok-free\.app"