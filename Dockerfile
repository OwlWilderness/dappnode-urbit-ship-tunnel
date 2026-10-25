# Inherit the verified official nonroot USER and ENTRYPOINT unchanged.
FROM cloudflare/cloudflared@sha256:c3f24df7c5e68c1467afc5486c155689f247eb02246b3a124fc5f42458728672
COPY origin-ca.pem /etc/cloudflared/origin-ca.pem
