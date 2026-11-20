Empty on purpose. docker-compose.yml mounts the repository's savanna/ folder (the official Savanna starter) here, and
Docker needs this folder to exist, because demo-host/ itself is mounted read-only. Without it Docker stops with
"make mountpoint ... read-only file system".
