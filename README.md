# Music Links

A [Vicinae](https://vicinae.com/) extension for creating cross-platform music links. Paste a link from a supported streaming service and copy one service-agnostic link to share.

<div align="center">
  <video src="https://github.com/user-attachments/assets/e3a1c73c-5415-4708-9c5b-87329e0ca69d" />
</div>

## Build with Nix

Nix with flakes enabled is the recommended setup. The flake provides the package, development tools, and dependencies.

```bash
nix build
```

Nix may ask you to approve the flake's Vicinae binary cache.

## Install

### Manual Nix build

Build directly into Vicinae's per-user extension directory:

```bash
extension_dir="${XDG_DATA_HOME:-$HOME/.local/share}/vicinae/extensions"
mkdir -p "$extension_dir"
nix build --out-link "$extension_dir/music-links"
```

### With Home Manager

Add the flake input:

```nix
inputs.vicinae-music-links.url = "github:arilence/vicinae-music-links";
```

Then add its package to Vicinae:

```nix
{ inputs, pkgs, ... }:
{
  programs.vicinae.extensions = [
    inputs.vicinae-music-links.packages.${pkgs.system}.default
  ];
}
```

## Develop

### With Nix

```bash
nix develop
npm run dev
```

The Nix shell provides `node_modules`; do not run `npm install` inside it. The development extension uses the ID `music-links-dev`, so it can coexist with the stable build.

To add a package, update only the manifest and lockfile, then exit and re-enter `nix develop`:

```bash
npm install --package-lock-only --legacy-peer-deps <package>
# Add --save-dev for a development dependency.
```

### With npm only

On a system with Node.js and npm installed:

```bash
npm ci --legacy-peer-deps
npm run dev
```

## Format and lint

Run these inside `nix develop`, or after installing dependencies with npm:

```bash
npm run format
npm run lint
```

## Acknowledgements

The application icon uses an icon from [Phosphor Icons](https://phosphoricons.com/), licensed under the [MIT License](https://github.com/phosphor-icons/core/blob/main/LICENSE).
