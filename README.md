# Music Links

A Vicinae extension for creating cross-platform music links.

Paste a link from a music streaming service, and Music Links generates a service-agnostic share link
that you can copy to your clipboard for quick sharing.

## Prerequisites

- [Nix](https://nixos.org/download/) with the `nix-command` and `flakes` experimental features
  enabled.

The flake offers Vicinae's Cachix cache as an optional build acceleration. Nix may ask you to
approve the flake configuration.

## Install

### With `nix build`

To install manually, use Vicinae's per-user extension directory as the Nix output link:

```console
extension_dir="${XDG_DATA_HOME:-$HOME/.local/share}/vicinae/extensions"
mkdir -p "$extension_dir"
nix build --out-link "$extension_dir/music-links"
```

To update it later, pull the latest changes and run the same commands again.

### With Home Manager

Add this repository as a flake input:

```nix
inputs.vicinae-music-links.url = "github:arilence/vicinae-music-links";
```

Then pass its default package to Vicinae's Home Manager module:

```nix
{ inputs, pkgs, ... }:
{
  programs.vicinae.extensions = [
    inputs.vicinae-music-links.packages.${pkgs.system}.default
  ];
}
```

## Development

1. Enter the development environment:

   ```bash
   # If using direnv
   direnv allow

   # Otherwise...
   nix develop
   ```

2. Start Vicinae's extension development command

   ```bash
   npm run dev
   ```

The development environment uses a separate extension identifier, `music-links-dev`, so that it can
be installed alongside the stable build.

The nix development shell links `node_modules` from the dependency graph in `package-lock.json`; do
not run a normal `npm install` or `npm add` inside it.

Instead, to add a dependency:

1. Use npm's `--package-lock-only` option

   ```bash
   # regular dependency
   npm install --package-lock-only <package-name>

   # or a dev dependency with `--save-dev`
   npm install --save-dev --package-lock-only <package-name>
   ```

2. Reload development environment

   ```bash
   # If using direnv
   direnv reload

   # Otherwise, exit and re-enter nix shell
   nix develop
   ```
