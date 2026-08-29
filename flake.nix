{
  description = "A Vicinae extension for creating cross-platform music links";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    vicinae = {
      url = "github:vicinaehq/vicinae";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  nixConfig = {
    extra-substituters = [ "https://vicinae.cachix.org" ];
    extra-trusted-public-keys = [
      "vicinae.cachix.org-1:1kDrfienkGHPYbkpNj1mWTr7Fm1+zcenzgTizIcI3oc="
    ];
  };

  outputs =
    {
      self,
      nixpkgs,
      vicinae,
    }:
    let
      inherit (nixpkgs) lib;

      packageJson = builtins.fromJSON (builtins.readFile ./package.json);
      supportedSystems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];
      forEachSystem = lib.genAttrs supportedSystems;
      pkgsFor =
        system:
        import nixpkgs {
          inherit system;
          config = lib.optionalAttrs (system == "x86_64-darwin") {
            # Nixpkgs 26.11 no longer supports Intel Darwin, but retains this escape hatch so
            # downstream flakes can keep evaluating an existing platform matrix.
            allowDeprecatedx86_64Darwin = "force";
          };
        };
    in
    {
      packages = forEachSystem (
        system:
        let
          pkgs = pkgsFor system;
          mkVicinaeExtension =
            if system == "x86_64-darwin" then
              pkgs.callPackage (vicinae.outPath + "/nix/mkVicinaeExtension.nix") { }
            else
              vicinae.lib.${system}.mkVicinaeExtension;
          package = mkVicinaeExtension {
            pname = "vicinae-extension-${packageJson.name}";
            version = packageJson.version;
            src = ./.;
            npmFlags = [ "--legacy-peer-deps" ];
            npmRebuildFlags = [ "--ignore-scripts" ];
          };
        in
        {
          default = package;
          music-links = package;
        }
      );

      checks = forEachSystem (system: {
        inherit (self.packages.${system}) music-links;
      });

      devShells = forEachSystem (
        system:
        let
          pkgs = pkgsFor system;
          formatter = self.formatter.${system};
          biomeArch = if pkgs.stdenv.hostPlatform.isAarch64 then "arm64" else "x64";
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.importNpmLock.hooks.linkNodeModulesHook
              pkgs.nodejs
              pkgs.typescript-language-server
              pkgs.yaml-language-server
              pkgs.vicinae
              formatter
            ];

            npmDeps = pkgs.importNpmLock.buildNodeModules {
              npmRoot = ./.;
              inherit (pkgs) nodejs;
              derivationArgs = lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux {
                npmFlags = [ "--libc=musl" ];
              };
            };

            postShellHook = lib.optionalString pkgs.stdenv.hostPlatform.isLinux ''
              biomeBinary="$PWD/node_modules/@biomejs/cli-linux-${biomeArch}-musl/biome"
              if [ -x "$biomeBinary" ]; then
                export BIOME_BINARY="$biomeBinary"
              else
                echo "warning: locked Biome musl executable not found at $biomeBinary" >&2
              fi
              unset biomeBinary
            '';
          };
        }
      );

      formatter = forEachSystem (system: (pkgsFor system).nixfmt-tree);
    };
}
