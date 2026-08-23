# Music Links

A Vicinae extension for creating cross-platform music links.

Paste a link from a music streaming service, and Music Links generates a service-agnostic share link
and can copy it to your clipboard.

## Prerequisites

- [Nix](https://nixos.org/download/) with the `nix-command` and `flakes` experimental features
  enabled.

The flake offers Vicinae's Cachix cache as an optional build acceleration. Nix may ask you to
approve the flake configuration. Declining the cache does not affect build correctness.

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

## Development

Enter the development environment, then start Vicinae's extension development command:

```console
nix develop
npm run dev
```

The development environment uses a separate extension ID `music-links-dev` and title
`Music Links (Dev)` so that it can be installed alongside the stable build.

The nix development shell links `node_modules` from the dependency graph in `package-lock.json`; do
not run a normal `npm install` or `npm add` inside it.

To add a dependency, use npm's `--package-lock-only` option:

```console
npm install --package-lock-only <package-name>
# or a dev dep
npm install --save-dev --package-lock-only <package-name>

direnv reload
```

If you do not use direnv, exit and re-enter `nix develop` instead.
