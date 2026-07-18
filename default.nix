{
  lib,
  config,
  dream2nix,
  ...
}:
let
  packageJson = builtins.fromJSON (builtins.readFile ./package.json);
in
{
  imports = [
    dream2nix.modules.dream2nix.nodejs-package-lock-v3
    dream2nix.modules.dream2nix.nodejs-granular-v3
    dream2nix.modules.dream2nix.nodejs-devshell-v3
  ];

  mkDerivation = {
    src = ./.;
  };

  deps = { nixpkgs, ... }: {
    inherit (nixpkgs)
      fetchFromGitHub
      stdenv
      ;
  };

  nodejs-package-lock-v3 = {
    packageLockFile = "${config.mkDerivation.src}/package-lock.json";
  };

  name = "vicinae-music-links";
  version = packageJson.version;
}
