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
It's still good to know how handle things without them, so I will also explain how to do things with only Git.
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

## Working Solo

The simplest way to use Git is to use it like a backup system.
First, you create a new repository on either [Github](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository) or [GitLab](https://docs.gitlab.com/user/project/).
Then you clone it with `git clone <REPO>`.
From that point on, all you have to do is:
- do some work
- commit
- push
- repeat
On its own there aren't a lot of reasons to choose this approach over a file syncing service like [Nextcloud](https://nextcloud.com/sign-up/).
No, the main reason you do this, is because you are either already familiar with the git workflow or want to get used to it.

## Contributing

Git truly shines as soon as you start collaborating with others.
On a high level this works like this:
- you modify some files in a Git repository
- you propose your changes via the Git forge
- maintainers of the repository review your changes
- as soon as they are happy with your changes, they will integrate your changes into the main branch of the repository.

As before you clone the repository with `git clone <REPO>`.
Change directories into that repository and run `git status`.
The branch that it shows is the default branch and is probably called `main` or `master`.
Before you start a new branch, you will run the following two commands to make sure you start with the latest state of the repository:

```shell
git switch <DEFAULT-BRANCH>
git pull
```

You switch and create a new branch with:

```shell
git switch <BRANCH>
```

That way you can work on multiple features at the same time and easily keep your default synchronized with the remote repository.

The next step, is to open a pull request on GitHub or merge request on GitLab.
They are equivalent, so I will call both of them pull requests from now on.
The idea of a pull request is to integrate the changes from one branch into another branch (typically the default branch).
However, you don't necessarily want to give every potential contributor the power to create new branches on your repository.
That is why the concept of forks exists.
Forks are copies of a repository that are hosted on the same Git forge.
Contributors can now create branches on their forks and open pull requests based on these branches.

If you don't have push access to the repository, now it's time to create your own fork.
Without the forge CLI tools, you first fork the repository in the web interface.

Then you'd run the following commands:

```shell
git remote rename origin upstream
git remote add origin <FORK>
```

When you cloned your repository, Git set the default branch of the original repo as upstream branch of your local default branch.
This is preserved by the remote rename, which is why the default branch can still be updated from upstream with `git pull` and no additional arguments.

Running one of these commands, both forks the repository and sets up the git remotes for you.

```
gh repo fork --remote
glab repo fork --remote
```

Then you need to push your local branch.
With Git, you first have to tell it that it should create the corresponding branch on the remote and set it as upstream branch.

```
git push --set-upstream origin <BRANCH>
```

Then you open the repository in the web interface, where it will suggest opening a pull request.
The upstream branch of your local branch is configured, which means you can update your remote by running `git push` without any additional arguments. 



`pr create` directly pushes and sets up your branch and opens the pull request for you.
If you have a fork available, it will ask you whether you want to push your branch there: 

```
gh pr create
glab mr create
```


## Checking out Pull Requests

While the command presented before are already more efficient than their git+web counterparts, the essential command is `pr checkout`.
The authors of these tools obviously agree since they added the convenient alias `co`.
