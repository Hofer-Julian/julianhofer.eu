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

Hey

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

```nix
{ config, pkgs, ... }:

{
  # Home Manager needs a bit of information about you and the
  # paths it should manage.
  home.username = "julian";
  home.homeDirectory = "/var/home/julian";

  # This value determines the Home Manager release that your
  # configuration is compatible with. This helps avoid breakage
  # when a new Home Manager release introduces backwards
  # incompatible changes.
  #
  # You can update Home Manager without changing this value. See
  # the Home Manager release notes for a list of state version
  # changes in each release.
  home.stateVersion = "22.05";

  # Let Home Manager install and manage itself.
  programs.home-manager.enable = true;
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
  
  home.packages = with pkgs; [
    bat
    fd
    gh
    glab
    ripgrep
  ];  
}
```