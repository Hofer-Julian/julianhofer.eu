+++
title = "How to install Nix on Fedora Silverblue"
date = 2022-11-25
draft = false

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
Updates are atomic and if there is something wrong with the newest version, you can always roll back.
You always move between immutable images of your operating system, but that also means that installing packages with `dnf` doesn't work anymore.
For GUI applications, the answers to this are `flatpak` and its app store [flathub](https://flathub.org/home).
For everything else you can enter a mutable Fedora container with the help of [toolbx](https://containertoolbx.org/).
There, the `dnf` command is readily available and can be used as usual.
This is convenient for development, but not necessarily outside it.
Whenever you want to use an installed CLI tool, you now have to enter the toolbx beforehand.
Also, there are a couple of system directories that are inaccessible from within the container.
 
# Nix

Nix is a cross-platform package manager with the [largest repository](https://repology.org/repositories/statistics/total) at the time of this writing.
Like with Silverblue, upgrades in Nix are atomic and can be rolled back.
The only problem is that Nix expects to be able to store its data at `/nix`, which cannot simply be created on Silverblue.

## Mount `/nix`

What we can do however, is to have the nix store at a different directory and then mount this directory at `/nix`.
First, we add a systemd [service unit](https://www.freedesktop.org/software/systemd/man/systemd.service.html) which ensures that the directory `/nix` is present.
For that, the service has to temporarily disable the immutability of `/` with `chattr`.
Run the following command to create or modify the service.
Also, make sure to replace `YOUR_USER` with your actual username. 

```bash
$ sudo systemctl edit --full --force ensure-nix-dir.service
```


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

Now we create a [mount unit](https://www.freedesktop.org/software/systemd/man/systemd.mount.html) which mounts `/nix` from `~/.nix` during start up.
Again, replace `YOUR_USER` with your username.


```bash
$ sudo systemctl edit --full --force nix.mount
```

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

In order to immediately activate the mount, execute the following:

```bash
$ sudo systemctl enable --now nix.mount
```

If you now check up on `/nix`, it should be owned by your user and have the following permission bits:

```bash
$ ls -ld /nix
drwxr-xr-x. 1 YOUR_USER root 16 22. Nov 18:08 /nix/
```

## Install Nix

Next, we perform a single-user installation of Nix as described in the [Nix manual](https://nixos.org/manual/nix/stable/installation/installing-binary.html#single-user-installation).

```bash
$ sh <(curl -L https://nixos.org/nix/install) --no-daemon
```

In order to have the corresponding tools in your `$PATH`, either restart your shell or source `nix.sh` as shown below.

```bash
$ source $HOME/.nix-profile/etc/profile.d/nix.sh
```

Now you can install tools on your machine with [`nix-env`](https://nixos.org/manual/nix/stable/command-ref/nix-env.html).
If that's all you want, then you can skip over to the last [section](./#toolbx).

# Home Manager

Home Manager is a tool that allows declarative configuration of user specific packages and dotfiles.
This not only helps you to keep track which changes you made to your user environment, but also greatly reduces the amount of work necessary to migrate to a new machine.
Convinced?
Then let's get started!

First, we add the `home-manager` channel to our nix channels.

```bash
$ nix-channel --add https://github.com/nix-community/home-manager/archive/master.tar.gz home-manager
```

Then we update our nix-channels.

```bash
$ nix-channel --update
```

Home Manager requires `NIX_PATH` to be set before we install it, so let's export it.

```bash
$ export NIX_PATH=$HOME/.nix-defexpr/channels:/nix/var/nix/profiles/per-user/root/channels${NIX_PATH:+:$NIX_PATH}
```

Now we can install `home-manager` with `nix-shell`.

```bash
$ nix-shell '<home-manager>' -A install
```

Log off and log in again.
After opening your terminal, `home-manager` should be in your `$PATH`.
You can edit its config file by executing:

```bash
$ home-manager edit
```

This should open a file with a couple of values already set.
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
$ home-manager switch
```

This also means that if you remove a setting or package in the config file, it will be removed on your system as well.

In order to update your environment run:
```bash
$ nix-channel --update
...
unpacking channels...
$ home-manager switch
```

# Toolbx

Most of the things you can do with a toolbx you can also do with Nix, but there is a steep learning curve.
At least at the beginning you will want to be able to access the config and packages managed by Home Manager inside your toolbx.

First enter your toolbx.
```bash
$ toolbox enter
```

Then create a symlink from `~/.nix` to `/nix`.

```bash
$ sudo ln -s ~/.nix /nix
```

Leave toolbox and enter again.
To see if everything is working as expected, you can try to view your git config with the cat-replacement [`bat`](https://github.com/sharkdp/bat#syntax-highlighting):

```bash
$ bat ~/.config/git/config
```


![The content of git config on a terminal as displayed by bat with syntax highlighting](/posts/01-silverblue-nix/bat-output.png)


# References

- [gitlab.com/ahayzen/silverblue-nix](https://gitlab.com/ahayzen/silverblue-nix)
- [reddit.com/r/SteamDeck/comments/yxpmlq/nix_homemanager_on_steam_deck](https://www.reddit.com/r/SteamDeck/comments/yxpmlq/nix_homemanager_on_steam_deck/)
