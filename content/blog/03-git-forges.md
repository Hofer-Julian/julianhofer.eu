+++
title = "How I use Git"
date = 2025-08-04
draft = true

[taxonomies]
categories = ["Git"]
tags = ["Git", "GitHub", "GitLab"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
outdate_warn = false
+++


When I set the goal for myself to contribute to open source back in 2018,
I mostly struggled with two technical challenges:
- Python virtual environments, and
- Git together with GitHub.

Solving the former is nowadays my [job](https://prefix.dev/),
so let me write up my current workflow for the latter.

Most people use Git in combination with modern Git forges like GitHub and GitLab.
Git doesn't know anything about these forges, which is why CLI tools exist to close that gap.
For GitHub there's [`gh`](https://cli.github.com/) and for GitLab there's [`glab`](https://docs.gitlab.com/editor_extensions/gitlab_cli/).
Both of them are Go binaries without any dependencies that work on Linux, macOS and Windows.
If you don't like any of the provided installation methods, you can simply download the binary, make it executable and put it in your `PATH`.

Luckily they also have mostly the same command line interface.
First, you have to login with the command that corresponds to your git forge:
```
gh auth login
glab auth login
```

In the case of `gh` this even authenticates Git with GitHub.
With GitLab, you still have to setup authentication via [SSH](https://docs.gitlab.com/user/ssh/). 


The simplest way to use Git is to use it like a backup system.
First, you create a new repository on either [Github](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository) or [GitLab](https://docs.gitlab.com/user/project/).
Then you clone it with `git clone`.
From that point on, all you have to do is:
- do some work
- commit
- push
- repeat
On its own there aren't a lot of reasons to choose this approach over a file syncing service like [Nextcloud](https://nextcloud.com/sign-up/).
No, the main reason you do this, is because you are either already familiar with the git workflow or want to get used to it.

Git truly shines as soon as you start collaborating with others.
On a high level this works like this:
- you modify some files in a Git repository
- you propose your changes via the Git forge
- maintainers of the repository review your changes
- as soon as they are happy with your changes, they will integrate your changes into the main branch of the repository.
