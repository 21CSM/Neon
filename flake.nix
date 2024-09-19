{
  description = "A Nix flake with Node.js 16, Yarn, and Python";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
          };
        };
        pythonWithPackages = pkgs.python3.withPackages (ps: with ps; [
          setuptools
        ]);
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_18
            yarn
            pythonWithPackages
            pkg-config
            gnumake
          ] ++ (if stdenv.isDarwin then [
            darwin.apple_sdk.frameworks.CoreServices
            darwin.apple_sdk.frameworks.CoreFoundation
            darwin.libobjc
            darwin.cctools
          ] else []);
          
          shellHook = ''
            export PYTHONPATH="${pythonWithPackages}/${pythonWithPackages.sitePackages}"
            export PATH="${pkgs.gnumake}/bin:$PATH"
            export NODE_OPTIONS=--openssl-legacy-provider
            ${if pkgs.stdenv.isDarwin then ''
              export CPPFLAGS="-I${pkgs.darwin.apple_sdk.frameworks.CoreServices}/include -I${pkgs.darwin.apple_sdk.frameworks.CoreFoundation}/include"
              export LDFLAGS="-L${pkgs.darwin.apple_sdk.frameworks.CoreServices}/Library -L${pkgs.darwin.apple_sdk.frameworks.CoreFoundation}/Library"
            '' else ""}
          '';
        };
      }
    );
}