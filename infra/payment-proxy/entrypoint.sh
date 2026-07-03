#!/bin/sh
set -eu

key_source=/run/secrets/payment_proxy_ssh_key
key_file=/tmp/payment_proxy_ssh_key

if [ ! -f "$key_source" ]; then
  echo "Payment proxy SSH key is missing: $key_source" >&2
  exit 1
fi

cp "$key_source" "$key_file"
chmod 600 "$key_file"

exec ssh -NT -4 \
  -i "$key_file" \
  -o BatchMode=yes \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o StrictHostKeyChecking=yes \
  -o UserKnownHostsFile=/etc/ssh/ssh_known_hosts \
  -L 0.0.0.0:3128:127.0.0.1:3128 \
  "${TARGET_USER:-root}@${TARGET_HOST:?TARGET_HOST is required}"
