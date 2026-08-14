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
          };
        in
        {
          default = package;
          music-links = package;
        }
      );

      checks = forEachSystem (
        system:
        let
          pkgs = pkgsFor system;
          package = self.packages.${system}.music-links;
        in
        {
          music-links = package;

          music-links-layout = pkgs.runCommand "music-links-layout" { } ''
            extension="${package}"

            if [ ! -f "$extension/package.json" ]; then
              echo "missing package.json at the extension root" >&2
              exit 1
            fi

            jsEntry="$(${pkgs.findutils}/bin/find "$extension" -maxdepth 1 -type f -name '*.js' -print -quit)"
            if [ -z "$jsEntry" ]; then
              echo "missing compiled JavaScript entry point at the extension root" >&2
              exit 1
            fi

            if [ ! -f "$extension/assets/extension_icon.png" ]; then
              echo "missing assets/extension_icon.png" >&2
              exit 1
            fi

            if [ -e "$extension/lib/node_modules" ]; then
              echo "unexpected lib/node_modules directory in the extension output" >&2
              exit 1
            fi

            if ${pkgs.gnugrep}/bin/grep --binary-files=without-match -R -F -q /build/ "$extension"; then
              echo "extension output contains a reference to /build/" >&2
              exit 1
            fi

            touch "$out"
          '';
        }
      );

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
              pkgs.vicinae
              formatter
            ];

            npmDeps = pkgs.importNpmLock.buildNodeModules {
              npmRoot = ./.;
              inherit (pkgs) nodejs;
            };

            postShellHook = ''
              export PATH="$PWD/node_modules/.bin:$PATH"
            ''
            + lib.optionalString pkgs.stdenv.hostPlatform.isLinux ''
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
