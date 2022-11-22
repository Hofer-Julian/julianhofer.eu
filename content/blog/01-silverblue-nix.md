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

There is a lot to like about [Fedora Silverblue](https://docs.fedoraproject.org/en-US/fedora-silverblue/).
Updates are atomic and if there is something wrong with the newest version you can always roll back.
You always move between immutable images of your operating system, but that also means that installing packages with `dnf` doesn't work anymore.
For GUI applications the answer to this is `flatpak` and it's app store [flathub](https://flathub.org/home)
For everything else you can enter a mutable Fedora container with the help of [toolbx](https://containertoolbx.org/).
There, the `dnf` command is readily available and can be used as usual.
This is convenient for development, but not necessarily outside of it.
Whenever you want to use an installed CLI tool, you now have to enter the toolbox beforehand.
Also there are a couple of system directories that are inaccessible inside the container.
 
# Nix

Nix is a cross-platform package manager with the [largest repository](https://repology.org/repositories/statistics/total) at the of this writing.
Like with Silverblue, upgrades in Nix are atomic and can be rolled back.
The only problem is that Nix expects to be able to store it's date at `/nix` which cannot be just created on Silverblue.

## Mount `/nix`



`sudo systemctl edit --full --force ensure-nix-dir.service`


```ini
[Unit]
Description=Ensure /nix is present
[Service]
Type=oneshot
ExecStartPre=chattr -i /
ExecStart=mkdir -p -m 0755 /nix
ExecStart=chown -R YOUR_USER
EcecStop=chattr +i /
```

`sudo systemctl edit --full --force nix.mount`

```ini
[Unit]
Description=Mount /nix from ~/.nix
After=local-fs.target var-home.mount ensure-nix-dir.service
Wants=ensure-nix-dir.service
[Mount]
Options=bind,nofail
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

Now log off and log in again.
After opening your terminal `home-manager` should be in your `PATH`.
You can edit its config file by executing:
`home-manager edit`


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
