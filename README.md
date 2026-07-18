# Music Links

A Vicinae extension for creating cross-platform music links.

Paste a link from a music streaming service, and Music Links generates a service-agnostic share link
and copies it to your clipboard—ready to send to friends regardless of which streaming service they
use.

## Prerequisites

- [Nix](https://nixos.org/download/) with the `nix-command` and `flakes` experimental features
  enabled.

## Build

Build the default package:

```console
nix build
```

To enter the development environment and run the program from source:

```console
nix develop
npm install
npm run dev
```
