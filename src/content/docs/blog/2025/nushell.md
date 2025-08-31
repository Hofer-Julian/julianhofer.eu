---
title: "Why Scripting is Nicer With Nushell"
date: 2025-08-31
tags: ["Nushell"]
draft: false
---

There are multiple ways improve your experience in the terminal.
You can get a nice prompt with [starship](https://starship.rs/).
On Linux and macOS you can switch to the [fish](https://fishshell.com) shell.
A lot of nice things like syntax highlighting, tab completion with help text and inline suggestions simply work out of the box.

I however went for [Nushell](https://www.nushell.sh/).
Unlike fish, Nu also works on Windows.
Since I don't use Windows as my daily driver that shouldn't matter all that much to me.

So let's see take a look at the pitch on Nu's homepage:

> Nu pipelines use structured data so you can safely select, filter, and sort the same way every time. Stop parsing strings and start solving problems.

When I first read this, this didn't really resonate with me.
Maybe I didn't write enough shell scripts at that time.

## Extract the Top Issues From a GitHub Repository

Let's look at a non-trivial example to find out why it's a big deal that Nu deals with structured data.
Repositories like [Zed](https://zed.dev/) maintain an [issue](https://github.com/zed-industries/zed/issues/6952) that show's the issues with the highest number of 👍 reactions created in the last week.

We will produce a script which does that as well using Nu.
I will use the [Pixi](https://pixi.sh/latest/) repository,
but any other repository with enough community engagement will do as well.

```nu
let repo = "prefix-dev/pixi"
```

Many modern CLI tools have a JSON interface and [`gh`](/blog/2025/git-forges/) is not different.
We need the following fields:
- `createdAt` so we only take the ones from last week
- `reactionGroups` so we can extract the 👍 reactions
- `title` and `url` to display them later

In the end we will get a [list](https://www.nushell.sh/lang-guide/chapters/types/basic_types/list.html#list) of [records](https://www.nushell.sh/lang-guide/chapters/types/basic_types/record.html#record) also known as a [table](https://www.nushell.sh/lang-guide/chapters/types/basic_types/table.html#table).
Each record represents one issue, and we pick one in order to get familiar with the structure.

```nu
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| get 1
```

```
╭────────────────┬────────────────────────────────────────────────────────────╮
│ createdAt      │ 2025-08-29T13:11:13Z                                       │
│                │ ╭───┬───────────┬────────────────────╮                     │
│ reactionGroups │ │ # │  content  │       users        │                     │
│                │ ├───┼───────────┼────────────────────┤                     │
│                │ │ 0 │ THUMBS_UP │ ╭────────────┬───╮ │                     │
│                │ │   │           │ │ totalCount │ 1 │ │                     │
│                │ │   │           │ ╰────────────┴───╯ │                     │
│                │ ╰───┴───────────┴────────────────────╯                     │
│ title          │ Ability to split pixi.lock (not toml!) into multiple files │
│ url            │ https://github.com/prefix-dev/pixi/issues/4467             │
╰────────────────┴────────────────────────────────────────────────────────────╯
```

Notice the pretty printing of the record without any prompting from our side.

### Only take Issues From Last Week

Nu also has first class support for [datetime](https://www.nushell.sh/lang-guide/chapters/types/basic_types/datetime.html#datetime) objects.
This makes it easy to only take the rows of our table where `createdAt` falls within the last week.

Normally, you'd set the current date like this:

```
let current date = date now
```


To make this reproducible in the future, I will set it to a fixed value instead:

```
let current_date = "Sun, 31 Aug 2025 12:00:00" | into datetime
```


```nu {3-5}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= $current_date - 1wk
| get createdAt
| last 5
```

```
╭───┬──────────────────────╮
│ 0 │ 2025-08-25T11:28:37Z │
│ 1 │ 2025-08-25T10:19:22Z │
│ 2 │ 2025-08-25T10:07:58Z │
│ 3 │ 2025-08-25T07:21:52Z │
│ 4 │ 2025-08-24T17:00:35Z │
╰───┴──────────────────────╯
```

We took the last 5 elements.
Since this blog post was written on August 31st, these results seem pretty reasonable. 


### Extract the 👍 Reactions

We don't have a nice way to extract the 👍 reactions.
As a reminder, that's how `reactionGroup` value looks like for the issue we looked at originally

```nu
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= $current_date - 1wk
| get 1
| get reactionGroups
```

```
╭───┬───────────┬────────────────────╮
│ # │  content  │       users        │
├───┼───────────┼────────────────────┤
│ 0 │ THUMBS_UP │ ╭────────────┬───╮ │
│   │           │ │ totalCount │ 1 │ │
│   │           │ ╰────────────┴───╯ │
╰───┴───────────┴────────────────────╯
```

Some issues will not have reactions at all

```nu {4}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= $current_date - 1wk
| get 0
| get reactionGroups
```

```
╭────────────╮
│ empty list │
╰────────────╯
```



```nu {5-8}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= $current_date - 1wk
| insert thumbsUp {
    $in.reactionGroups 
    | where content == THUMBS_UP 
}
| get thumbsUp
| first 5
```

```
╭───┬────────────────────────────────────────╮
│ 0 │ [list 0 items]                         │
│ 1 │ ╭───┬───────────┬────────────────────╮ │
│   │ │ # │  content  │       users        │ │
│   │ ├───┼───────────┼────────────────────┤ │
│   │ │ 0 │ THUMBS_UP │ ╭────────────┬───╮ │ │
│   │ │   │           │ │ totalCount │ 1 │ │ │
│   │ │   │           │ ╰────────────┴───╯ │ │
│   │ ╰───┴───────────┴────────────────────╯ │
│ 2 │ [list 0 items]                         │
│ 3 │ [list 0 items]                         │
│ 4 │ ╭───┬───────────┬────────────────────╮ │
│   │ │ # │  content  │       users        │ │
│   │ ├───┼───────────┼────────────────────┤ │
│   │ │ 0 │ THUMBS_UP │ ╭────────────┬───╮ │ │
│   │ │   │           │ │ totalCount │ 5 │ │ │
│   │ │   │           │ ╰────────────┴───╯ │ │
│   │ ╰───┴───────────┴────────────────────╯ │
╰───┴────────────────────────────────────────╯
```


```nu {7}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= $current_date - 1wk
| insert thumbsUp { 
    $in.reactionGroups 
    | where content == THUMBS_UP
    | get users.totalCount 
}
| get thumbsUp
| first 5
```

```
╭───┬────────────────╮
│ 0 │ [list 0 items] │
│ 1 │ ╭───┬───╮      │
│   │ │ 0 │ 1 │      │
│   │ ╰───┴───╯      │
│ 2 │ [list 0 items] │
│ 3 │ [list 0 items] │
│ 4 │ ╭───┬───╮      │
│   │ │ 0 │ 5 │      │
│   │ ╰───┴───╯      │
╰───┴────────────────╯
```

```nu {8, 10}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= $current_date - 1wk
| insert thumbsUp { 
    $in.reactionGroups 
    | where content == THUMBS_UP
    | get users.totalCount 
    | get 0 --optional
}
| first 5
```

```
╭───┬───╮
│ 0 │   │
│ 1 │ 1 │
│ 2 │   │
│ 3 │   │
│ 4 │ 5 │
╰───┴───╯
```



```nu {4-9}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= $current_date - 1wk
| insert thumbsUp { $in.reactionGroups 
                    | where content == THUMBS_UP 
                    | get users.totalCount 
                    | get 0 --optional }
| select reactionGroups thumbsUp
| first 5
```

```
╭───┬────────────────────────────────────────┬──────────╮
│ # │             reactionGroups             │ thumbsUp │
├───┼────────────────────────────────────────┼──────────┤
│ 0 │ [list 0 items]                         │        0 │
│ 1 │ ╭───┬───────────┬────────────────────╮ │        1 │
│   │ │ # │  content  │       users        │ │          │
│   │ ├───┼───────────┼────────────────────┤ │          │
│   │ │ 0 │ THUMBS_UP │ ╭────────────┬───╮ │ │          │
│   │ │   │           │ │ totalCount │ 1 │ │ │          │
│   │ │   │           │ ╰────────────┴───╯ │ │          │
│   │ ╰───┴───────────┴────────────────────╯ │          │
│ 2 │ [list 0 items]                         │        0 │
│ 3 │ [list 0 items]                         │        0 │
│ 4 │ ╭───┬───────────┬────────────────────╮ │        5 │
│   │ │ # │  content  │       users        │ │          │
│   │ ├───┼───────────┼────────────────────┤ │          │
│   │ │ 0 │ THUMBS_UP │ ╭────────────┬───╮ │ │          │
│   │ │   │           │ │ totalCount │ 5 │ │ │          │
│   │ │   │           │ ╰────────────┴───╯ │ │          │
│   │ │ 1 │ HEART     │ ╭────────────┬───╮ │ │          │
│   │ │   │           │ │ totalCount │ 1 │ │ │          │
│   │ │   │           │ ╰────────────┴───╯ │ │          │
│   │ ╰───┴───────────┴────────────────────╯ │          │
╰───┴────────────────────────────────────────┴──────────╯
```

### Get the Five Issues With the Most 👍 Reactions

```nu {9-10}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= $current_date - 1wk
| insert thumbsUp { $in.reactionGroups 
                    | where content == THUMBS_UP 
                    | get users.totalCount 
                    | get 0 --optional }
| select title url thumbsUp
| sort-by --reverse thumbsUp
| first 5
```

```
╭───┬─────────────────────────────────────────────────────────────────────────────────────┬──────────────────────────────┬──────────╮
│ # │                                        title                                        │             url              │ thumbsUp │
├───┼─────────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────┼──────────┤
│ 0 │ Proposal to allow the use of Pixi workspaces through a named registry of workspaces │ https://github.com/prefix-de │        5 │
│   │                                                                                     │ v/pixi/issues/4461           │          │
│ 1 │ pixi-build: load variants from packages or files                                    │ https://github.com/prefix-de │        1 │
│   │                                                                                     │ v/pixi/issues/4429           │          │
│ 2 │ `pixi run echo '{{ hello }}'` fails                                                 │ https://github.com/prefix-de │        1 │
│   │                                                                                     │ v/pixi/issues/4432           │          │
│ 3 │ Environment variable of tasks are broken when defined inside task                   │ https://github.com/prefix-de │        1 │
│   │                                                                                     │ v/pixi/issues/4451           │          │
│ 4 │ Documentation: Add switchable pyproject.toml / pixi.toml code snippets              │ https://github.com/prefix-de │        1 │
│   │                                                                                     │ v/pixi/issues/4452           │          │
╰───┴─────────────────────────────────────────────────────────────────────────────────────┴──────────────────────────────┴──────────╯
```

### Rename `thumbsUp` column


```nu {11}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= $current_date - 1wk
| insert thumbsUp { $in.reactionGroups 
                    | where content == THUMBS_UP 
                    | get users.totalCount 
                    | get 0 --optional }
| select title url thumbsUp
| sort-by --reverse thumbsUp
| rename --column { thumbsUp: 👍 }
| first 5
```

```
╭───┬─────────────────────────────────────────────────────────────────────────────────────┬────────────────────────────────────┬────╮
│ # │                                        title                                        │                url                 │ 👍 │
├───┼─────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────┼────┤
│ 0 │ Proposal to allow the use of Pixi workspaces through a named registry of workspaces │ https://github.com/prefix-dev/pixi │  5 │
│   │                                                                                     │ /issues/4461                       │    │
│ 1 │ pixi-build: load variants from packages or files                                    │ https://github.com/prefix-dev/pixi │  1 │
│   │                                                                                     │ /issues/4429                       │    │
│ 2 │ `pixi run echo '{{ hello }}'` fails                                                 │ https://github.com/prefix-dev/pixi │  1 │
│   │                                                                                     │ /issues/4432                       │    │
│ 3 │ Environment variable of tasks are broken when defined inside task                   │ https://github.com/prefix-dev/pixi │  1 │
│   │                                                                                     │ /issues/4451                       │    │
│ 4 │ Documentation: Add switchable pyproject.toml / pixi.toml code snippets              │ https://github.com/prefix-dev/pixi │  1 │
│   │                                                                                     │ /issues/4452                       │    │
╰───┴─────────────────────────────────────────────────────────────────────────────────────┴────────────────────────────────────┴────╯
```

### Format table in Markdown Format


```nu {13}
let top_issues_week = gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= $current_date - 1wk
| insert thumbsUp { $in.reactionGroups 
                    | where content == THUMBS_UP 
                    | get users.totalCount 
                    | get 0 --optional }
| select title url thumbsUp
| sort-by --reverse thumbsUp
| rename --column { thumbsUp: 👍 }
| first 5
| to md
```

|title|url|👍|
|-|-|-|
|Proposal to allow the use of Pixi workspaces through a named registry of workspaces|https://github.com/prefix-dev/pixi/issues/4461|5|
|pixi-build: load variants from packages or files|https://github.com/prefix-dev/pixi/issues/4429|1|
|`pixi run echo '{{ hello }}'` fails|https://github.com/prefix-dev/pixi/issues/4432|1|
|Environment variable of tasks are broken when defined inside task|https://github.com/prefix-dev/pixi/issues/4451|1|
|Documentation: Add switchable pyproject.toml / pixi.toml code snippets|https://github.com/prefix-dev/pixi/issues/4452|1|


## Create an Issue Containing the Top Issues

```nu
gh issue create --title "Top issues last week" --body $top_issues_week
```
