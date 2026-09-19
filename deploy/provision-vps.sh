#!/usr/bin/env bash
set -euo pipefail

[[ $(id -u) -eq 0 ]] || { echo 'Run this script as root.' >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive

if ! command -v docker >/dev/null; then
  apt-get update -qq
  apt-get install -y ca-certificates curl gnupg ufw
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
  apt-get update -qq
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

if [[ ! -f /etc/docker/daemon.json ]]; then
  install -d /etc/docker
  cat > /etc/docker/daemon.json <<'EOF'
{"log-driver":"local","log-opts":{"max-size":"10m","max-file":"3"},"live-restore":true}
EOF
  systemctl restart docker
fi
systemctl enable --now docker

if ! id deploy >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash deploy
fi
usermod -aG docker deploy
install -d -m 0700 -o deploy -g deploy /home/deploy/.ssh
install -d -m 0750 -o deploy -g deploy /srv/apps/n7cosmetics
install -d -m 0700 -o deploy -g deploy /srv/apps/n7cosmetics/secrets /srv/apps/n7cosmetics/backups /srv/apps/n7cosmetics/import
install -d -m 0755 -o 1000 -g 1000 /srv/apps/n7cosmetics/media

# The fresh server may have an existing AllowUsers root restriction.
if sshd -T | grep -q '^allowusers '; then
  printf 'AllowUsers deploy\n' > /etc/ssh/sshd_config.d/60-n7-deploy.conf
  sshd -t
  systemctl reload ssh
fi

ufw allow 22/tcp comment 'SSH keys'
ufw allow 80/tcp comment 'HTTP and ACME'
ufw allow 443/tcp comment 'HTTPS'
ufw default deny incoming
ufw default allow outgoing
ufw --force enable

docker version --format '{{.Server.Version}}'
docker compose version
ufw status
