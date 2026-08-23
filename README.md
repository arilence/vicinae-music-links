# Music Links

A Vicinae extension for creating cross-platform music links.

Paste a link from a music streaming service, and Music Links generates a service-agnostic share link
and copies it to your clipboard—ready to send to friends regardless of which streaming service they
use.

## Prerequisites

- [Nix](https://nixos.org/download/) with the `nix-command` and `flakes` experimental features
  enabled.

The flake offers Vicinae's Cachix cache as an optional build acceleration. Nix may ask you to approve
the flake configuration. To trust flake-provided cache settings automatically, set
`accept-flake-config = true` in your Nix configuration. Declining the cache does not affect build
correctness.

## Build and validate

Build the directly installable Vicinae extension:

```console
nix build
```

Build the extension through the flake's checks:

```console
nix flake check
```

Format Nix files with the flake's formatter:

```console
nix fmt
```

## Development

Enter the development environment, then start Vicinae's extension development command:

```console
nix develop
npm run dev
```

The development command uses the extension ID `music-links-dev` and title `Music Links (Dev)`, so
it can coexist with a declaratively installed production build. The production manifest remains
unchanged: `npm run build` and `nix build` continue to produce the `music-links` extension.

The development shell links `node_modules` from the dependency graph in `package-lock.json`; do not
run a normal `npm install` or `npm add` inside it. The shell includes the cached Vicinae package from
Nixpkgs, Node.js, `vici`, Biome, TypeScript, esbuild, and the TypeScript language server. The launcher
may lag the Vicinae flake input; `@vicinae/api` remains pinned by `package-lock.json`.

Run the existing source checks and extension build with:

```console
npm run lint
npm run build -- --out=/tmp/vicinae-music-links-test
```

When changing dependencies, update only the lock file and reload the development environment:

```console
npm install --package-lock-only <package>
direnv reload
```

If you do not use direnv, exit and re-enter `nix develop` instead.

## Home Manager

Add this repository as a flake input:

```nix
inputs.music-links.url = "github:arilence/vicinae-music-links";
```

Then pass its default package to Vicinae's Home Manager module:

```nix
{ inputs, pkgs, ... }:
{
  programs.vicinae.extensions = [
    inputs.music-links.packages.${pkgs.system}.default
  ];
}
```
