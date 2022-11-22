+++
title = "How to install Nix on Fedora Silverblue"
date = 2099-12-12
draft = true

[taxonomies]
categories = ["Fedora", "Nix"]
tags = ["Fedora", "Silverblue", "Nix"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
outdate_warn = false
+++


# Nix

## Mount `/nix`

`sudo systemctl edit --full --force ensure-nix-dir.service`


```ini
[Unit]
Description=Mount /nix from ~/.nix
After=local-fs.target var-home.mount ensure-nix-dir.service
Wants=ensure-nix-dir.service
[Mount]
Options=bind,nofail,owner=YOUR_USER
What=/home/YOUR_USER/.nix
Where=/nix
[Install]
WantedBy=multi-user.target
```

`sudo systemctl edit --full --force nix.mount`

```ini
[Unit]
Description=Mount /nix from ~/.nix
After=local-fs.target var-home.mount ensure-nix-dir.service
Wants=ensure-nix-dir.service
[Mount]
Options=bind,nofail,owner=YOUR_USER
What=/home/YOUR_USER/.nix
Where=/nix
[Install]
WantedBy=multi-user.target
```

`sudo systemctl enable --now nix.mount`

## Install Nix

`sh <(curl -L https://nixos.org/nix/install) --no-daemon`

`source $HOME/.nix-profile/etc/profile.d/nix.sh`

# Home Manager

`nix-channel --add https://github.com/nix-community/home-manager/archive/master.tar.gz home-manager`

`nix-channel --update`

`export NIX_PATH=$HOME/.nix-defexpr/channels:/nix/var/nix/profiles/per-user/root/channels${NIX_PATH:+:$NIX_PATH}`

`nix-shell '<home-manager>' -A install`


```nix
{ config, pkgs, ... }:

{
  # Leave `home.username`, `home.homeDirectory`, `home.stateVersion`
  # and `programs.home-manager.enable` as they are 
  
  programs.git = {
    enable = true;
    userName  = "Julian Hofer";
    userEmail = "julianhofer@gnome.org";
    extraConfig = {
      init = {
        defaultBranch = "main";
      };
      pull = {
        rebase = true;
      };
      rebase = {
        autostash = true;
      };
    };
  };
  
  # Ensure that the following packages are installed
  home.packages = with pkgs; [
    bat
    fd
    gh
    glab
    ripgrep
  ];  
}
```

# Toolbox

`toolbox enter`
`sudo ln -s ~/.nix /nix`

Leave toolbox and enter again.
Now, you should be able to view your git config with the cat-replacement [`bat`](https://github.com/sharkdp/bat#syntax-highlighting):

`bat $HOME/.config/git/config`


![The content of git config on a terminal as displayed by bat with syntax highlighting](/posts/01-silverblue-nix/bat-output.png)