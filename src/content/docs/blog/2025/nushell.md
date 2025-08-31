---
title: "Why scripting is nicer with nushell"
date: 2025-08-31
tags: ["Nushell"]
draft: false
---

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


```nu {4-9}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
| insert thumbsUp { $in.reactionGroups 
                    | where content == THUMBS_UP 
                    | get users.totalCount 
                    | get --optional 0 
                    | default 0 }
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

```nu {9-10}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
| insert thumbsUp { $in.reactionGroups 
                    | where content == THUMBS_UP 
                    | get users.totalCount 
                    | get --optional 0 
                    | default 0 }
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


```nu {11}
gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
| insert thumbsUp { $in.reactionGroups 
                    | where content == THUMBS_UP 
                    | get users.totalCount 
                    | get --optional 0 
                    | default 0 }
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


```nu {13}
let top_issues_week = gh issue list --repo $repo --json createdAt,reactionGroups,title,url
| from json
| where ($it.createdAt | into datetime) >= (date now) - 1wk
| insert thumbsUp { $in.reactionGroups 
                    | where content == THUMBS_UP 
                    | get users.totalCount 
                    | get --optional 0 
                    | default 0 }
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


```nu
gh issue create --title "Top issues last week" --body $top_issues_week
```
