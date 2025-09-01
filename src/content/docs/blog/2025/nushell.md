---
title: "Scripting is More Fun With Nushell"
date: 2025-08-31
tags: ["Nushell", "GitHub", "Scripting"]
draft: false
---

There are multiple ways to improve your experience in the terminal.
You can get a nice prompt with [starship](https://starship.rs/).
On Linux and macOS, you can switch to the [fish](https://fishshell.com) shell.
A lot of nice things like syntax highlighting, tab completion with help text and inline suggestions simply work out of the box.

However, I went for [Nushell](https://www.nushell.sh/).
Unlike fish, Nu also works on Windows.
Nu's interactive experience is nearly as nice as fish's out-of-the-box and just as nice with a few configuration tweaks.
Since I don't use Windows as my daily driver that shouldn't matter all that much to me, but it can be an extra benefit.

So let's take a look at the pitch on Nu's homepage:

> Nu pipelines use structured data so you can safely select, filter, and sort the same way every time. Stop parsing strings and start solving problems.

When I first read this, this didn't really resonate with me.
Maybe I didn't write enough shell scripts at that time.

<!-- excerpt -->


:::note
At the time of this writing, Nu still makes breaking releases from time to time.
If you are using Nu scripts in production, it is recommended to pin the version of Nu. 
:::

## Extract the Top Issues From a Repository

Let's look at a non-trivial example to find out why it's a big deal that Nu deals with structured data.
Some GitHub repositories like [Zed's](https://github.com/zed-industries/zed) have an [issue](https://github.com/zed-industries/zed/issues/6952) that shows the issues with the highest number of 👍 reactions created within in the last week.

We will produce a script that does that as well using Nu.
You can follow my instructions in your terminal or within your favorite editor.
Many editors support Nu's integrated language server.
After saving, you just run `nu script.nu`

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
Please note that this will return a different issue for you, since more issues will have been opened on this repo by the time you read this.

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

Notice that Nu pretty prints the record per default.

### Only take Issues From Last Week

Nu also has first class support for [datetime](https://www.nushell.sh/lang-guide/chapters/types/basic_types/datetime.html#datetime) objects.
This makes it easy to only take the rows of our table where `createdAt` falls within the last week.

```nu {3-5}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
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
Considering that this blog has been written on August 31st, these results seem pretty reasonable. 


### Extract the 👍 Reactions

We don't have a nice way to extract the 👍 reactions yet, so let's work on that.
As a reminder, that's how `reactionGroup` value looks like for the issue we looked at originally.

```nu
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
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

This issue, however, does not have reactions at all.

```nu {4}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
| get 0
| get reactionGroups
```

```
╭────────────╮
│ empty list │
╰────────────╯
```

Let's insert a new column `thumbsUp`, which is based on the column `reactionGroup`.
Of this reaction table, it only takes rows with `THUMBS_UP` reaction.
Rows that don't have any `THUMBS_UP` reactions will result in an empty list.

```nu {4-8}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
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

We care about the total count.
We get that by accessing `users.totalCount`.

```nu {7}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
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

Some rows now have empty lists, and some have lists containing a single entry: the number of 👍 reactions.
With `get 0` we get the first element of a list.
By adding `--optional`, this command doesn't fail on empty lists but returns `null` instead.
We replace `null` with 0, by running `default 0`.


```nu {8-9}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
| insert thumbsUp { 
    $in.reactionGroups 
    | where content == THUMBS_UP
    | get users.totalCount 
    | get 0 --optional
    | default 0
}
| get thumbsUp
| first 5
```

```
╭───┬───╮
│ 0 │ 0 │
│ 1 │ 1 │
│ 2 │ 0 │
│ 3 │ 0 │
│ 4 │ 5 │
╰───┴───╯
```


### Get the Five Issues With the Most 👍 Reactions

The three columns we truly care about are `thumbsUp`, `title` and `url`, so let's select those.
We also sort the table, so that the issues with the most 👍 reactions come first.

```nu {11-12}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
| insert thumbsUp { 
    $in.reactionGroups 
    | where content == THUMBS_UP 
    | get users.totalCount 
    | get 0 --optional
    | default 0 
}
| select thumbsUp title url
| sort-by --reverse thumbsUp
| first 5
```

```
╭───┬──────────┬─────────────────────────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────╮
│ # │ thumbsUp │                                        title                                        │                      url                       │
├───┼──────────┼─────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ 0 │        5 │ Proposal to allow the use of Pixi workspaces through a named registry of workspaces │ https://github.com/prefix-dev/pixi/issues/4461 │
│ 1 │        1 │ pixi-build: load variants from packages or files                                    │ https://github.com/prefix-dev/pixi/issues/4429 │
│ 2 │        1 │ `pixi run echo '{{ hello }}'` fails                                                 │ https://github.com/prefix-dev/pixi/issues/4432 │
│ 3 │        1 │ Environment variable of tasks are broken when defined inside task                   │ https://github.com/prefix-dev/pixi/issues/4451 │
│ 4 │        1 │ Documentation: Add switchable pyproject.toml / pixi.toml code snippets              │ https://github.com/prefix-dev/pixi/issues/4452 │
╰───┴──────────┴─────────────────────────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────╯
```

### Rename `thumbsUp` Column

Unicode can be a bit annoying to type in the terminal, but now it's type to rename our `thumbsUp` column to 👍.

```nu {13}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
| insert thumbsUp { 
    $in.reactionGroups 
    | where content == THUMBS_UP 
    | get users.totalCount 
    | get 0 --optional
    | default 0
}
| select thumbsUp title url
| sort-by --reverse thumbsUp
| rename --column { thumbsUp: 👍 }
| first 5
```

```
╭───┬────┬─────────────────────────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────╮
│ # │ 👍 │                                        title                                        │                      url                       │
├───┼────┼─────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ 0 │  5 │ Proposal to allow the use of Pixi workspaces through a named registry of workspaces │ https://github.com/prefix-dev/pixi/issues/4461 │
│ 1 │  1 │ pixi-build: load variants from packages or files                                    │ https://github.com/prefix-dev/pixi/issues/4429 │
│ 2 │  1 │ `pixi run echo '{{ hello }}'` fails                                                 │ https://github.com/prefix-dev/pixi/issues/4432 │
│ 3 │  1 │ Environment variable of tasks are broken when defined inside task                   │ https://github.com/prefix-dev/pixi/issues/4451 │
│ 4 │  1 │ Documentation: Add switchable pyproject.toml / pixi.toml code snippets              │ https://github.com/prefix-dev/pixi/issues/4452 │
╰───┴────┴─────────────────────────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────╯
```

### Format Table in Markdown Format

In the end, we want to add this table to the body of a GitHub issue.
Luckily, Nu has integrated support to convert its values to Markdown.

```nu {15}
let top_issues_week = gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
| insert thumbsUp { 
    $in.reactionGroups 
    | where content == THUMBS_UP 
    | get users.totalCount 
    | get 0 --optional
    | default 0
}
| select thumbsUp title url
| sort-by --reverse thumbsUp
| rename --column { thumbsUp: 👍 }
| first 5
| to md
```

What you can see here, is the Markdown table directly embedded in this post which is also written in Markdown.

|👍|title|url|
|-|-|-|
|5|Proposal to allow the use of Pixi workspaces through a named registry of workspaces|https://github.com/prefix-dev/pixi/issues/4461|
|1|pixi-build: load variants from packages or files|https://github.com/prefix-dev/pixi/issues/4429|
|1|`pixi run echo '{{ hello }}'` fails|https://github.com/prefix-dev/pixi/issues/4432|
|1|Environment variable of tasks are broken when defined inside task|https://github.com/prefix-dev/pixi/issues/4451|
|1|Documentation: Add switchable pyproject.toml / pixi.toml code snippets|https://github.com/prefix-dev/pixi/issues/4452|


## Create the Issue

Now we can create an issue with the table we just generated.

```nu
gh issue create --title "Top issues last week" --body $top_issues_week
```

How to update an existing issue is left as an exercise to the reader.

## Conclusion


I hope I convinced you that scripting with Nushell can be a lot of fun.
It's quick to type like bash, and has proper data types like Python.

With Nu, it's easy to interact with your data: You extend your pipeline until you are happy with what it does. 
