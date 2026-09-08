# Agent context (plugin)

```text
.agents/
├── rules/                         # Synced from agent-practices + agent-payload
└── skills/
    ├── payload/                   # Vendored via skills:install — do not hand-edit
    ├── payload-overrides/              # Synced overlay — do not hand-edit
    └── payload-plugin-achievements/  # Hand-maintained plugin skill
```

See root [`AGENTS.md`](../AGENTS.md) for reading order and sync commands.

**Editor:** `.cursor/rules` and `.cursor/skills` symlink here.
