{
  description = "A Vicinae extension for creating cross-platform music links";

  inputs = {
    dream2nix.url = "github:nix-community/dream2nix";
    nixpkgs.follows = "dream2nix/nixpkgs";
  };

  outputs =
    {
      self,
      dream2nix,
      nixpkgs,
    }:
    let
      eachSystem = nixpkgs.lib.genAttrs [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];
    in
    {
      packages = eachSystem (system: {
        default = dream2nix.lib.evalModules {
          packageSets.nixpkgs = nixpkgs.legacyPackages.${system};
          modules = [
            # Import our actual package definiton as a dream2nix module from ./default.nix
            ./default.nix
            {
              # Aid dream2nix to find the project root. This setup should also works for mono repos.
              # If you only have a single project, the defaults should be good enough.
              paths.projectRoot = ./.;
              # can be changed to ".git" or "flake.nix" to get rid of .project-root
              paths.projectRootFile = "flake.nix";
              paths.package = ./.;
            }
          ];
        };
      });

      # Reuse Dream2nix's generated shell so Node.js/npm and all binaries from the locked npm
      # dependencies are available without listing them twice.
      devShells = eachSystem (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          package = self.packages.${system}.default;
          inherit (package.config.mkDerivation) buildInputs nativeBuildInputs;
        in
        {
          default = pkgs.mkShell {
            inputsFrom = [ package ];
            packages =
              buildInputs
              ++ nativeBuildInputs

              # List any additional devshell-specific packages here.
              ++ [
                pkgs.nodePackages.typescript-language-server
              ];
            shellHook = ''
              export PATH="$PWD/node_modules/.bin:$PATH"
            '';
          };
        }
      );
    };
}
