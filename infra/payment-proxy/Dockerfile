FROM alpine:3.20

RUN apk add --no-cache openssh-client

COPY known_hosts /etc/ssh/ssh_known_hosts
COPY entrypoint.sh /usr/local/bin/payment-proxy-tunnel

RUN chmod 755 /usr/local/bin/payment-proxy-tunnel

ENTRYPOINT ["/usr/local/bin/payment-proxy-tunnel"]
