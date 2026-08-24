# RECOVER.md — new machine to working system

This file is the portability thesis, executable. It must always describe the
*current* system. Every infra decision that makes this document longer is
probably wrong. The restore drill is run (by the agent, on a schedule) —
backup you haven't restored from is a rumor.

> STATUS: pre-code. Steps marked TODO become concrete as the system exists.
> December migration to dedicated hardware executes this file as written.

**Portability = this file + the restic repo. Machine images never travel.**
A VM is just a disposable host with a small blast radius; bare metal, macOS,
VM, or VPS are all equally valid targets. Corollary for the substrate: no
platform-isms in code — bun/sqlite/caddy/restic run native everywhere; the
only per-platform seam is service supervision (systemd on Linux, launchd on
macOS), and it lives here, not in the code.

## 0. What you need

- restic repo credentials (B2) — stored: `TODO (password manager entry name)`
- Device tokens are *revocable*, not precious: mint new ones on restore.
- This repo: `git@github.com:cjpais/burrito.git`, branch `stuffed-burrito`.

## 1. Provision a host

Any always-on machine. Needs: runtime (bun, caddy, restic), tailscale, this
repo. On a dedicated box (Linux bare metal or macOS): install those, skip to
step 2.

Current dev host is a sandbox VM on the Fedora box:

```bash
# on the Fedora host
sudo dnf install -y @virtualization && sudo systemctl enable --now libvirtd
sudo usermod -aG libvirt $USER   # re-login

# re-login so the libvirt group is active (beware: tmux keeps old groups)

curl -LO https://cloud.debian.org/images/cloud/trixie/latest/debian-13-genericcloud-amd64.qcow2
sudo mv debian-13-genericcloud-amd64.qcow2 /var/lib/libvirt/images/
sudo qemu-img create -f qcow2 -F qcow2 \
  -b /var/lib/libvirt/images/debian-13-genericcloud-amd64.qcow2 \
  /var/lib/libvirt/images/home.qcow2 40G
# images live under /var/lib/libvirt/images: system QEMU can't traverse a 700 $HOME
# qcow2 is thin — the 40G cap costs only what's used

virsh -c qemu:///system net-start default 2>/dev/null; virsh -c qemu:///system net-autostart default
virt-install --connect qemu:///system --name home --memory 4096 --vcpus 2 \
  --disk path=/var/lib/libvirt/images/home.qcow2 --import --osinfo debian13 \
  --cloud-init ssh-key=$HOME/.ssh/id_ed25519.pub --network default --noautoconsole
# ALWAYS --connect qemu:///system: session libvirt has no NAT bridge and
# silently falls back to user-mode networking (no leases, no inbound ssh)

virsh -c qemu:///system domifaddr home   # then ssh debian@192.168.122.x
# NAT address is host-local; from other machines use tailscale (below) or -J
```

In the VM: `tailscale up`, install runtime (bun, caddy, restic), clone repo.

## 2. Restore data

```bash
restic -r <b2-repo> restore latest --target /srv/home
# expected layout: /srv/home/{streams,blobs,views,index.sqlite}
```

## 3. Rebuild derived state

```bash
# TODO: home index rebuild   (streams+blobs -> index.sqlite; MUST always work)
# TODO: home views render    (name records -> views/ trees)
```

## 4. Verify

```bash
# TODO: home verify  — counts per stream vs index, blob hashes spot-check,
#        newest event age, blob_locations tier audit
```

## 5. Repoint

- DNS: ingest.<domain> -> new IP (or relay VPS unchanged if using one)
- Mint fresh device tokens; revoke old generation
- Re-enable listeners + restic timer + the scheduled restore drill
