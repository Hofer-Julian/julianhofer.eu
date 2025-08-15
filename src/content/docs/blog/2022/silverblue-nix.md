---
title: "How to install Nix on Fedora Silverblue"
date: 2022-11-25
tags: ["Fedora", "Silverblue", "Nix"]
draft: false
excerpt: There is a lot to like about [Fedora Silverblue](https://docs.fedoraproject.org/en-US/fedora-silverblue/). The base of your operating system is immutable, so you cannot really break your system with updates. However, that also means that installing packages with `dnf` doesn't work anymore. This post is about how to install Nix, which allows you to install CLI tools without modifying your base system.
---

:::caution
Since Fedora 42, the Determinate Nix installer [doesn't work anymore](https://github.com/DeterminateSystems/nix-installer/issues/1445) out of the box.
:::

There is a lot to like about [Fedora Silverblue](https://docs.fedoraproject.org/en-US/fedora-silverblue/).
Updates are atomic and if there is something wrong with the newest version, you can always roll back.
You always move between immutable images of your operating system, but that also means that installing packages with `dnf` doesn't work anymore.
For GUI applications, the answers to this are `flatpak` and its app store [flathub](https://flathub.org/home).
For everything else you can enter a mutable Fedora container with the help of [toolbx](https://containertoolbx.org/).
There, the `dnf` command is readily available and can be used as usual.
This is convenient for development, but not necessarily outside it.
Whenever you want to use an installed CLI tool, you now have to enter the toolbx beforehand.
Also, there are a couple of system directories that are inaccessible from within the container.


## Nix

Nix is a cross-platform package manager with the [largest repository](https://repology.org/repositories/statistics/total) at the time of this writing.
Like with Silverblue, upgrades in Nix are atomic and can be rolled back.
In order to install it, we run the [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer):
```bash
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
```

To get started using Nix, open a new shell or run source `nix-daemon.sh` as shown below:


```bash
. /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
```

Now you can install tools on your machine with [`nix-env`](https://nixos.org/manual/nix/stable/command-ref/nix-env.html).
If that's all you want, then you can skip over to the last [section](./#distrobox).

## Home Manager

Home Manager is a tool that allows declarative configuration of user specific packages and dotfiles.
This not only helps you to keep track which changes you made to your user environment, but also greatly reduces the amount of work necessary to migrate to a new machine.
Convinced?
Then let's get started!

First, we add the `nixpkgs-unstable` and `home-manager` channels.

```bash
nix-channel --add https://nixos.org/channels/nixpkgs-unstable
nix-channel --add https://github.com/nix-community/home-manager/archive/master.tar.gz home-manager
```

Then we update our nix-channels.

```bash
nix-channel --update
```

Now we can install `home-manager` with `nix-shell`.

```bash
nix-shell '<home-manager>' -A install
```

You can edit its config file by executing:

```bash
home-manager edit
```

This should open your editor with a couple of values already set.
In the following snippet you see:
- how to set your git data with useful [extra config](https://leosiddle.com/posts/2020/07/git-config-pull-rebase-autostash/), and
- how to ensure that a set of [nix packages](https://search.nixos.org/packages?channel=unstable) is installed.

```nix
{ config, pkgs, ... }:

{
  # Leave `home.username`, `home.homeDirectory`, `home.stateVersion`
  # and `programs.home-manager.enable` as they are

  # Set git config
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


Now we activate our config file by executing

```bash
home-manager switch
```

This also means that if you remove a setting or package in the config file, it will be removed on your system as well.

In order to update your environment run:
```bash
nix-channel --update
...
unpacking channels...
```

```shell
home-manager switch
```

## Distrobox

[Distrobox](https://distrobox.privatedns.org/) is a tool that creates container that are tightly integrated with the host.
This makes it perfect for development tasks.

First install distrobox.
```bash
rpm-ostree install --apply-live distrobox
```

Enter your distrobox with:
```bash
distrobox enter
```

Distrobox mounts `/nix` inside of your container.
This way you can continue using Nix and the apps you've installed with it.
To see if everything is working as expected, you can try to view your git config with the cat-replacement [`bat`](https://github.com/sharkdp/bat#syntax-highlighting):

```bash
bat ~/.config/git/config
```

![The content of git config on a terminal as displayed by bat with syntax highlighting](../../../../assets/bat-output.png)

You can find the discussion at this Mastodon [post](https://chaos.social/@ju/110933089661444452).

## References

- [gitlab.com/ahayzen/silverblue-nix](https://gitlab.com/ahayzen/silverblue-nix)
- [reddit.com/r/SteamDeck/comments/yxpmlq/nix_homemanager_on_steam_deck](https://www.reddit.com/r/SteamDeck/comments/yxpmlq/nix_homemanager_on_steam_deck/)
