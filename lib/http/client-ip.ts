import { BlockList, isIP } from "node:net";

// Cloudflare's published ranges, verified 2026-10-01. Keep in sync with deploy/docker-compose.prod.yml.
const cloudflare = new BlockList();
for (const cidr of ["173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22", "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32"]) {
  const [address, prefix] = cidr.split("/");
  cloudflare.addSubnet(address, Number(prefix), isIP(address) === 6 ? "ipv6" : "ipv4");
}
export function clientIpAddress(headers: Pick<Headers, "get">): string | undefined {
  const chain = headers.get("x-forwarded-for")?.split(",").map(value => value.trim()) ?? [];
  // Traefik discards untrusted forwarding headers, then appends its actual peer.
  // Only accept Cloudflare's client headers when that peer is a verified Cloudflare edge.
  const peer = chain.at(-1) ?? "";
  const family = isIP(peer);
  if (family && cloudflare.check(peer, family === 6 ? "ipv6" : "ipv4")) {
    const ipv6 = headers.get("cf-connecting-ipv6")?.trim() ?? "";
    if (isIP(ipv6) === 6) return ipv6; // Preserve the genuine IPv6 when Pseudo IPv4 overwrites XFF.
    const client = headers.get("cf-connecting-ip")?.trim() ?? "";
    if (isIP(client)) return client;
  }
  const candidate = chain[0] ?? headers.get("x-real-ip")?.trim() ?? "";
  return isIP(candidate) ? candidate : undefined;
}
